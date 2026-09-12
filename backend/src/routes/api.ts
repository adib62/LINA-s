import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

import { AVAILABLE_MODELS } from "../config/models";
import { getSettings, updateSettings, Settings } from "../services/settings";
import {
    listThreads,
    getThread,
    createThread,
    updateThread,
    deleteThread,
    appendMessage
} from "../services/threads";
import { chatWithTools } from "../services/chat";
import { buildPrompt } from "../prompts/buildPrompt";
import { searchMemory, updateMemory } from "../services/memory";
import { getCurrentTime } from "../utils/time";
import { parseGroqResponse } from "../utils/json";
import { translateToJapanese } from "../services/translator";
import { generateVoice } from "../services/voicevox";
import { ChatMessage } from "../services/history";
import { DEFAULT_INDONESIAN, DEFAULT_JAPANESE } from "../config/constants";
import { logError } from "../utils/logger";
import { runAgentTask, finalizeAgentSession, getSession, listSessions, FileContext } from "../services/agent";
import { extractFileText } from "../utils/fileText";
import { listReminders, createReminder, removeReminder, markDone } from "../services/reminder";
import { listEvents, createEvent, removeEvent, Rentang } from "../services/calendar";
import { parseWaktu } from "../utils/datetime";
import { OUTPUT_DIR, ensureOutputDir } from "../config/paths";
import { runSchedulerOnce } from "../services/scheduler";
import { broadcast } from "../websocket/websocket";
import { captureScreenshot } from "../vision/screenshot";

const router = Router();

const uploadDir = path.join(process.cwd(), "src", "data", "uploads");

function ensureUploadDir(): void {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}

/* ============================ MODELS ============================ */

router.get("/models", (_req, res) => {
    res.json({ success: true, models: AVAILABLE_MODELS });
});

/* ============================ SETTINGS ============================ */

router.get("/settings", (_req, res) => {
    res.json({ success: true, settings: getSettings() });
});

router.post("/settings", (req, res) => {
    const patch = req.body as Partial<Settings>;
    const settings = updateSettings(patch);

    // Beritahu semua tab yang lagi kebuka
    broadcast({ status: "SETTINGS_UPDATE", settings });

    res.json({ success: true, settings });
});

/* ============================ THREADS ============================ */

router.get("/threads", (_req, res) => {
    res.json({ success: true, threads: listThreads() });
});

router.get("/threads/:id", (req, res) => {
    const thread = getThread(req.params.id);

    if (!thread) {
        return res.status(404).json({ success: false, error: "Thread tidak ditemukan." });
    }

    res.json({ success: true, thread });
});

router.post("/threads", (req, res) => {
    const name = String(req.body?.name ?? "Chat baru");
    res.json({ success: true, thread: createThread(name) });
});

router.patch("/threads/:id", (req, res) => {
    const thread = updateThread(req.params.id, {
        name: req.body?.name,
        pinned: req.body?.pinned
    });

    if (!thread) {
        return res.status(404).json({ success: false, error: "Thread tidak ditemukan." });
    }

    res.json({ success: true, thread });
});

router.delete("/threads/:id", (req, res) => {
    const ok = deleteThread(req.params.id);

    if (!ok) {
        return res.status(404).json({ success: false, error: "Thread tidak ditemukan." });
    }

    res.json({ success: true });
});

/* ============================ CHAT (TEKS) ============================ */

let chatAbort: AbortController | null = null;

router.post("/chat", async (req, res) => {
    const pesan = String(req.body?.pesan ?? "").trim();
    const threadId = req.body?.threadId ? String(req.body.threadId) : null;
    const wantVoice = req.body?.voice === true;

    if (!pesan) {
        return res.status(400).json({ success: false, error: "Pesan kosong." });
    }

    if (chatAbort) chatAbort.abort();
    chatAbort = new AbortController();
    const signal = chatAbort.signal;

    const settings = getSettings();

    try {
        const thread = threadId ? getThread(threadId) : undefined;

        // Riwayat diambil per-thread, bukan global, biar tiap chat terpisah
        const riwayat: ChatMessage[] = (thread?.messages ?? []).map(m => ({
            role: m.role,
            content: m.content
        }));

        const konteks = await searchMemory(pesan);
        const sistem = buildPrompt(getCurrentTime(), konteks);

        const messages: ChatMessage[] = [
            { role: "system", content: sistem },
            ...riwayat,
            { role: "user", content: pesan }
        ];

        const outcome = await chatWithTools(messages, signal, {
            model: settings.model,
            effort: settings.effort
        });

        if (signal.aborted) {
            return res.json({ success: false, aborted: true });
        }

        let indo = DEFAULT_INDONESIAN;
        let jepang = DEFAULT_JAPANESE;

        const parsed = parseGroqResponse(outcome.raw);

        if (parsed) {
            if (parsed.indo) indo = parsed.indo;

            if (parsed.jepang && parsed.jepang.trim() !== "") {
                jepang = parsed.jepang.replace(/[a-zA-Z0-9:]/g, "").trim();
            } else {
                jepang = await translateToJapanese(indo);
            }

            await updateMemory(
                parsed.action || "none",
                parsed.old_memory || "",
                parsed.ingatan_baru || ""
            );
        }

        if (thread) {
            appendMessage(thread.id, "user", pesan);
            appendMessage(thread.id, "assistant", indo);
        }

        // Suara opsional: chat mode default diam, voice mode minta audio
        let audioBase64 = "";

        if (wantVoice && settings.autoSpeak) {
            try {
                audioBase64 = await generateVoice(jepang, settings.speakerId, signal);
            } catch (error) {
                logError("VoiceVox gagal, lanjut tanpa audio.", error);
            }
        }

        return res.json({
            success: true,
            indo,
            jepang,
            audioBase64,
            toolCall: outcome.toolCall ?? null,
            toolResult: outcome.toolResult ?? null,
            threadId: thread?.id ?? null
        });

    } catch (error) {
        logError("Chat gagal!", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error && error.message.includes("kelamaan mikir")
                ? error.message
                : "Terjadi kesalahan pada server."
        });
    }
});

/* ============================ UPLOAD ============================ */

/**
 * Terima file sebagai base64 dari frontend (FileReader).
 * Dibikin begini biar gak perlu nambah dependency multer.
 */
router.post("/upload", (req, res) => {
    try {
        const name = String(req.body?.name ?? "").trim();
        const data = String(req.body?.data ?? "");

        if (!name || !data) {
            return res.status(400).json({ success: false, error: "Nama atau data file kosong." });
        }

        // Buang path traversal — cuma ambil nama filenya
        const safeName = path.basename(name).replace(/[^\w.\- ]/g, "_");
        const base64 = data.includes(",") ? data.split(",")[1] : data;

        ensureUploadDir();

        const target = path.join(uploadDir, `${Date.now()}_${safeName}`);
        fs.writeFileSync(target, Buffer.from(base64, "base64"));

        return res.json({
            success: true,
            file: { name: safeName, path: target, size: fs.statSync(target).size }
        });

    } catch (error) {
        logError("Upload gagal!", error);
        return res.status(500).json({ success: false, error: "Gagal menyimpan file." });
    }
});

/* ============================ SCREENSHOT ============================ */

router.post("/screenshot", async (_req, res) => {
    try {
        const result = await captureScreenshot();
        return res.json({ success: true, result });
    } catch (error) {
        logError("Screenshot gagal!", error);
        return res.status(500).json({
            success: false,
            error: "Vision service tidak merespons. Pastikan vision-service jalan."
        });
    }
});

/* ============================ REMINDER ============================ */

router.get("/reminders", (req, res) => {
    const includeDone = req.query.done === "true";
    res.json({ success: true, reminders: listReminders(includeDone) });
});

router.post("/reminders", (req, res) => {
    const text = String(req.body?.text ?? "").trim();
    const waktu = String(req.body?.waktu ?? "").trim();

    if (!text) {
        return res.status(400).json({ success: false, error: "Teks pengingat kosong." });
    }

    const parsed = parseWaktu(waktu);

    if (!parsed) {
        return res.status(400).json({
            success: false,
            error: `Waktu "${waktu}" tidak bisa dipahami.`
        });
    }

    res.json({
        success: true,
        reminder: createReminder(text, parsed.at),
        label: parsed.label
    });
});

router.delete("/reminders/:id", (req, res) => {
    const ok = removeReminder(req.params.id);

    if (!ok) {
        return res.status(404).json({ success: false, error: "Pengingat tidak ditemukan." });
    }

    res.json({ success: true });
});

router.post("/reminders/:id/done", (req, res) => {
    const r = markDone(req.params.id);

    if (!r) {
        return res.status(404).json({ success: false, error: "Pengingat tidak ditemukan." });
    }

    res.json({ success: true, reminder: r });
});

/* ============================ CALENDAR ============================ */

router.get("/calendar", (req, res) => {
    const rentang = String(req.query.rentang ?? "semua") as Rentang;
    res.json({ success: true, events: listEvents(rentang) });
});

router.post("/calendar", (req, res) => {
    const title = String(req.body?.title ?? "").trim();
    const waktu = String(req.body?.waktu ?? "").trim();

    if (!title) {
        return res.status(400).json({ success: false, error: "Judul acara kosong." });
    }

    const mulai = parseWaktu(waktu);

    if (!mulai) {
        return res.status(400).json({
            success: false,
            error: `Waktu "${waktu}" tidak bisa dipahami.`
        });
    }

    const selesaiTeks = String(req.body?.selesai ?? "").trim();
    const selesai = selesaiTeks ? parseWaktu(selesaiTeks, new Date(mulai.at)) : null;

    res.json({
        success: true,
        event: createEvent({
            title,
            startAt: mulai.at,
            endAt: selesai ? selesai.at : null,
            location: req.body?.location,
            note: req.body?.note
        }),
        label: mulai.label
    });
});

router.delete("/calendar/:id", (req, res) => {
    const ok = removeEvent(req.params.id);

    if (!ok) {
        return res.status(404).json({ success: false, error: "Jadwal tidak ditemukan." });
    }

    res.json({ success: true });
});

/* ============================ FILES (output office tools) ============================ */

router.get("/files", (_req, res) => {
    ensureOutputDir();

    const files = fs.readdirSync(OUTPUT_DIR)
        .map(name => {
            const stat = fs.statSync(path.join(OUTPUT_DIR, name));
            return { name, size: stat.size, mtime: stat.mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime);

    res.json({ success: true, files });
});

router.get("/files/:name", (req, res) => {
    // basename supaya "../../../etc/passwd" tidak bisa keluar dari OUTPUT_DIR
    const safeName = path.basename(req.params.name);
    const filePath = path.join(OUTPUT_DIR, safeName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "File tidak ditemukan." });
    }

    res.download(filePath, safeName);
});

/* ============================ SCHEDULER (debug) ============================ */

router.post("/scheduler/run-once", async (_req, res) => {
    try {
        await runSchedulerOnce();
        res.json({ success: true, message: "Satu putaran scheduler dijalankan." });
    } catch (error) {
        logError("Trigger manual scheduler gagal!", error);
        res.status(500).json({ success: false, error: "Gagal menjalankan scheduler." });
    }
});

/* ============================ AGENT ============================ */

let agentAbort: AbortController | null = null;

router.get("/agent/sessions", (_req, res) => {
    res.json({ success: true, sessions: listSessions() });
});

router.get("/agent/sessions/:id", (req, res) => {
    const session = getSession(req.params.id);

    if (!session) {
        return res.status(404).json({ success: false, error: "Sesi tidak ditemukan." });
    }

    res.json({ success: true, session });
});

router.post("/agent/run", async (req, res) => {
    const task = String(req.body?.task ?? "").trim();
    const file = req.body?.file as { name?: string; path?: string } | undefined;

    if (!task) {
        return res.status(400).json({ success: false, error: "Task kosong." });
    }

    if (agentAbort) agentAbort.abort();
    agentAbort = new AbortController();

    try {
        let fileContext: FileContext | undefined;

        if (file?.path && file?.name) {
            fileContext = { name: file.name, teks: await extractFileText(file.path) };
        }

        const session = await runAgentTask(task, agentAbort.signal, fileContext);
        return res.json({ success: true, session });
    } catch (error) {
        logError("Agent run gagal!", error);
        return res.status(500).json({ success: false, error: "Agent gagal dijalankan." });
    }
});

router.post("/agent/sessions/:id/finalize", async (req, res) => {
    const text = String(req.body?.text ?? "").trim();

    if (!text) {
        return res.status(400).json({ success: false, error: "Teks final kosong." });
    }

    try {
        const session = await finalizeAgentSession(req.params.id, text);
        return res.json({ success: true, session });
    } catch (error) {
        logError("Finalisasi agent gagal!", error);
        return res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : "Gagal memfinalisasi sesi."
        });
    }
});

router.post("/agent/stop", (_req, res) => {
    if (agentAbort) {
        agentAbort.abort();
        agentAbort = null;
    }
    res.json({ success: true });
});

export default router;
