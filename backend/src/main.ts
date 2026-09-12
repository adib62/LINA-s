import express from 'express';
import cors from 'cors';
import path from 'path';

import { PORT } from './config/env';
import { getHistory, addHistory } from './services/history';
import { setupWebsocketServer, kirimKeFrontend, broadcast } from './websocket/websocket';
import { generateVoice } from './services/voicevox';
import { initMemory, searchMemory, updateMemory, topikContextBlock } from './services/memory';
import { buildPrompt } from './prompts/buildPrompt';
import { chatWithTools } from './services/chat';
import { translateToJapanese } from './services/translator';
import { getCurrentTime } from './utils/time';
import { parseGroqResponse } from './utils/json';
import { logRawResponse, logError, logInfo } from './utils/logger';
import { VOICE_SPEED, DEFAULT_JAPANESE, DEFAULT_INDONESIAN, VOICE_EXCLUDED_TOOLS } from './config/constants';
import { ChatMessage } from './services/history';
import { registerTools } from './tools';
import { getSettings } from './services/settings';
import { startScheduler } from './services/scheduler';
import { promptsSourceInfo } from './prompts/buildPrompt';
import apiRouter from './routes/api';

const app = express();
app.use(cors());
// Batas dinaikkan karena upload file dikirim sebagai base64 di body JSON
app.use(express.json({ limit: '25mb' }));

// Sajikan frontend langsung dari backend, jadi cukup buka http://localhost:5000
app.use(express.static(path.join(process.cwd(), '..', 'frontend')));

// Registrasi tool SEKALI saja, sebelum server jalan
const tools = registerTools();

console.log("========== REGISTERED TOOLS ==========");
console.log(tools.map(t => t.name).join("\n"));
console.log("======================================");

app.use("/api", apiRouter);

const server = app.listen(PORT, async () => {
    console.log("==================================================");
    console.log("🤖 L.I.N.A. CORE BACKEND v38.0");
    console.log(`🚀 API & WebSocket aktif di port ${PORT}`);
    console.log(`🖥  UI: http://localhost:${PORT}`);
    console.log(`ℹ  VoiceVox: chmod +x ~/.voicevox/VOICEVOX.AppImage`);
    console.log(`📓 Prompts dibaca dari: ${promptsSourceInfo()}`);
    console.log("==================================================");
    await initMemory();
    startScheduler();
});

let currentAbortController: AbortController | null = null;

setupWebsocketServer(server, () => {
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }
});

/**
 * Endpoint voice mode: jawaban dikirim lewat WebSocket bareng audio.
 * Chat mode pakai POST /api/chat yang balikin teks langsung.
 */
app.post('/api/tanya', async (req, res) => {
    const { pesan, voice_id } = req.body;

    if (!pesan) return res.status(400).json({ error: "Matriks sibuk." });

    const settings = getSettings();
    const speakerId = voice_id ? parseInt(voice_id) : settings.speakerId;

    if (currentAbortController) {
        currentAbortController.abort();
    }

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
        const waktuSekarang = getCurrentTime();
        const konteksRelevan = (await searchMemory(pesan)) + topikContextBlock();
        const sifatLina = buildPrompt(waktuSekarang, konteksRelevan, VOICE_EXCLUDED_TOOLS);

        const messagesForGroq: ChatMessage[] = [
            { role: "system", content: sifatLina },
            ...getHistory(),
            { role: "user", content: pesan }
        ];

        const outcome = await chatWithTools(messagesForGroq, signal, {
            model: settings.model,
            effort: settings.effort
        });

        const raw = outcome.raw;

        if (signal.aborted) {
            console.log("🛑 Chat dibatalkan");
            return res.json({ success: false });
        }

        addHistory("user", pesan);
        addHistory("assistant", raw);

        logRawResponse(waktuSekarang, raw);

        let teksIndo = DEFAULT_INDONESIAN;
        let teksJepang = DEFAULT_JAPANESE;

        try {
            const parseData = parseGroqResponse(raw);

            if (!parseData) {
                return res.status(500).json({
                    success: false,
                    error: "Format JSON dari Groq tidak valid."
                });
            }

            if (parseData.indo) teksIndo = parseData.indo;

            if (parseData.jepang && parseData.jepang.trim() !== "") {
                teksJepang = parseData.jepang.replace(/[a-zA-Z0-9:]/g, "").trim();
            } else {
                teksJepang = await translateToJapanese(teksIndo);
            }

            await updateMemory(
                parseData.action || "none",
                parseData.old_memory || "",
                parseData.ingatan_baru || "",
                parseData.topik || ""
            );

        } catch (error) {
            logError("Gagal nge-parse JSON dari Groq!", error);
        }

        let audioBase64 = "";

        if (settings.autoSpeak) {
            audioBase64 = await generateVoice(teksJepang, speakerId, signal);
        }

        if (signal.aborted) {
            console.log("🛑 Voice dibatalkan");
            return res.json({ success: false });
        }

        logInfo("💬 dikirim ke frontend");
        kirimKeFrontend("SPEAKING", pesan, teksIndo, VOICE_SPEED, audioBase64);

        return res.json({ success: true, indo: teksIndo });

    } catch (error) {
        logError("Request gagal!", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error && error.message.includes("kelamaan mikir")
                ? error.message
                : "Terjadi kesalahan pada server."
        });
    }
});
