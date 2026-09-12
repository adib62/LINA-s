import { askGroq } from "./groq";
import { getSettings } from "./settings";
import { broadcast } from "../websocket/websocket";
import { ChatMessage } from "./history";
import { logError } from "../utils/logger";
import { AVAILABLE_MODELS } from "../config/models";
import { sendTelegramMessage } from "./telegram";

/**
 * Model buat sub-agent paralel, dipisah dari model chat biasa (`groq/compound`
 * gak masuk karena internalnya udah fan-out ke beberapa model sendiri).
 * Tiap sub-agent dijatah model beda giliran (round-robin) supaya limit token/menit
 * Groq (per-model, bukan per-akun) gak numpuk di satu model pas 2-5 sub-agent
 * nembak bersamaan.
 */
const SUB_AGENT_MODELS = AVAILABLE_MODELS
    .filter(m => m.provider === "groq" && m.id !== "groq/compound")
    .map(m => m.id);

function pickSubAgentModel(index: number, fallback: string): string {
    if (SUB_AGENT_MODELS.length === 0) return fallback;
    return SUB_AGENT_MODELS[index % SUB_AGENT_MODELS.length];
}

/** Isi file yang dilampirkan pengguna buat konteks tugas (lihat utils/fileText.ts). */
export interface FileContext {
    name: string;
    /** Null kalau tipe filenya belum bisa diekstrak (misal gambar/docx). */
    teks: string | null;
}

export type AgentStatus = "queued" | "running" | "preview" | "done" | "failed";

export interface SubAgent {
    id: string;
    label: string;
    role: string;
    task: string;
    model: string;
    status: AgentStatus;
    progress: number;
    logs: string[];
    output?: string;
}

export interface AgentSession {
    id: string;
    task: string;
    status: AgentStatus;
    createdAt: number;
    agents: SubAgent[];
    summary?: string;
}

const sessions = new Map<string, AgentSession>();

export function getSession(id: string): AgentSession | undefined {
    return sessions.get(id);
}

export function listSessions(): AgentSession[] {
    return [...sessions.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function emit(session: AgentSession): void {
    broadcast({ status: "AGENT_UPDATE", session });
}

function log(session: AgentSession, agent: SubAgent, line: string): void {
    agent.logs.push(line);
    // Batasi log biar memori gak membengkak kalau task-nya panjang
    if (agent.logs.length > 60) agent.logs.shift();
    emit(session);
}

/**
 * Minta LLM memecah task jadi beberapa sub-agent.
 * Kalau gagal parse, jatuh ke pembagian default 3 agent.
 */
function withFileContext(text: string, fileContext?: FileContext): string {
    if (!fileContext) return text;

    return fileContext.teks
        ? `${text}\n\n[LAMPIRAN: ${fileContext.name}]\n${fileContext.teks}`
        : `${text}\n\n[LAMPIRAN: ${fileContext.name}] (tipe file ini belum bisa dibaca otomatis)`;
}

async function planAgents(
    task: string,
    signal: AbortSignal,
    fileContext?: FileContext
): Promise<Array<{ label: string; role: string; task: string }>> {

    const settings = getSettings();

    const messages: ChatMessage[] = [
        {
            role: "system",
            content:
                "Kamu adalah perencana tugas. Pecah tugas pengguna menjadi 2 sampai 5 sub-tugas " +
                "yang bisa dikerjakan PARALEL dan tidak saling bergantung.\n\n" +
                "Kalau ada [LAMPIRAN] di pesan pengguna, pastikan sub-tugas yang kamu susun " +
                "benar-benar memanfaatkan isi lampiran itu, bukan cuma tugas umum.\n\n" +
                "Balas HANYA JSON dengan bentuk:\n" +
                '{"agents":[{"label":"RESEARCH","role":"peneliti yang mengumpulkan fakta",' +
                '"task":"kumpulkan fakta tentang X"}]}\n\n' +
                "Aturan:\n" +
                "- label: SATU KATA huruf kapital (RESEARCH, ANALYSIS, WRITER, REVIEW, OUTLINE).\n" +
                "- role: deskripsi singkat peran agen tersebut.\n" +
                "- task: instruksi konkret untuk agen tersebut.\n" +
                "- Jangan bikin sub-tugas yang harus menunggu hasil sub-tugas lain."
        },
        { role: "user", content: withFileContext(task, fileContext) }
    ];

    const raw = await askGroq(messages, signal, {
        model: settings.model,
        effort: settings.effort,
        jsonMode: true
    });

    try {
        const parsed = JSON.parse(raw);
        const agents = Array.isArray(parsed?.agents) ? parsed.agents : [];

        const cleaned = agents
            .filter((a: any) => a && a.task)
            .slice(0, 5)
            .map((a: any) => ({
                label: String(a.label || "AGENT").toUpperCase().slice(0, 12),
                role: String(a.role || "asisten"),
                task: String(a.task)
            }));

        if (cleaned.length > 0) return cleaned;
    } catch (error) {
        logError("Gagal parse rencana agent, pakai fallback.", error);
    }

    return [
        { label: "RESEARCH", role: "peneliti", task: `Kumpulkan poin penting untuk: ${task}` },
        { label: "ANALYSIS", role: "penganalisis", task: `Analisis dan susun kerangka untuk: ${task}` },
        { label: "WRITER", role: "penulis", task: `Tulis draf jawaban untuk: ${task}` }
    ];
}

async function runSubAgent(
    session: AgentSession,
    agent: SubAgent,
    signal: AbortSignal,
    fileContext?: FileContext
): Promise<void> {

    const settings = getSettings();

    agent.status = "running";
    agent.progress = 5;
    log(session, agent, `Sub-agent ${agent.label} dijalankan (model: ${agent.model}).`);

    // Progress semu supaya bar-nya bergerak selama nunggu LLM
    const ticker = setInterval(() => {
        if (agent.progress < 90) {
            agent.progress = Math.min(90, agent.progress + Math.random() * 8);
            emit(session);
        }
    }, 700);

    try {
        log(session, agent, "Mengirim instruksi ke model...");

        const output = await askGroq(
            [
                {
                    role: "system",
                    content:
                        `Kamu adalah sub-agent "${agent.label}" milik LINA. Peranmu: ${agent.role}. ` +
                        "Kerjakan HANYA bagianmu. Jawab ringkas, padat, dalam Bahasa Indonesia. " +
                        "Jangan menyapa, jangan basa-basi, langsung isi."
                },
                { role: "user", content: withFileContext(agent.task, fileContext) }
            ],
            signal,
            { model: agent.model, effort: settings.effort, jsonMode: false }
        );

        clearInterval(ticker);

        agent.output = output.trim();
        agent.progress = 100;
        agent.status = "done";

        log(session, agent, `Selesai. ${agent.output.length} karakter dihasilkan.`);

    } catch (error) {
        clearInterval(ticker);
        agent.status = "failed";
        agent.progress = 100;
        log(
            session,
            agent,
            `Gagal: ${error instanceof Error ? error.message : "error tidak diketahui"}`
        );
    }
}

/** Orchestrator: rencanakan, spawn paralel, lalu gabungkan hasilnya. */
export async function runAgentTask(
    task: string,
    signal: AbortSignal,
    fileContext?: FileContext
): Promise<AgentSession> {

    const settings = getSettings();

    const session: AgentSession = {
        id: `ag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        task,
        status: "running",
        createdAt: Date.now(),
        agents: []
    };

    sessions.set(session.id, session);
    emit(session);

    // 1. Rencanakan
    const plan = await planAgents(task, signal, fileContext);

    session.agents = plan.map((p, i) => ({
        id: `A${i + 1}`,
        label: p.label,
        role: p.role,
        task: p.task,
        model: pickSubAgentModel(i, settings.model),
        status: "queued",
        progress: 0,
        logs: []
    }));

    emit(session);

    // 2. Jalankan semua sub-agent berbarengan
    await Promise.all(
        session.agents.map(agent => runSubAgent(session, agent, signal, fileContext))
    );

    // 3. Gabungkan hasil
    const finished = session.agents.filter(a => a.status === "done");

    if (finished.length === 0) {
        session.status = "failed";
        session.summary = "Semua sub-agent gagal dijalankan.";
        emit(session);
        return session;
    }

    const combined = finished
        .map(a => `### ${a.label}\n${a.output}`)
        .join("\n\n");

    try {
        session.summary = (
            await askGroq(
                [
                    {
                        role: "system",
                        content:
                            "Kamu adalah LINA, orchestrator. Gabungkan hasil sub-agent di bawah " +
                            "menjadi satu jawaban akhir yang rapi dan enak dibaca untuk pengguna. " +
                            "Bahasa Indonesia. Jangan sebut-sebut soal sub-agent."
                    },
                    { role: "user", content: `Tugas asli: ${task}\n\n${combined}` }
                ],
                signal,
                { model: settings.model, effort: settings.effort, jsonMode: false }
            )
        ).trim();

        session.status = "preview";
    } catch (error) {
        logError("Gagal menyusun ringkasan agent.", error);
        session.summary = combined;
        session.status = "preview";
    }

    emit(session);
    return session;
}

/**
 * Revisi draft preview berdasarkan feedback pengguna — LLM nulis ulang draftnya.
 * `currentText` diambil dari textarea di frontend (bukan session.summary), biar
 * editan manual yang belum disimpan tetep jadi basis revisi. Sesi tetap di status
 * "preview" setelahnya, jadi bisa direvisi lagi atau langsung difinalisasi.
 */
export async function reviseAgentSession(id: string, currentText: string, feedback: string): Promise<AgentSession> {
    const session = sessions.get(id);

    if (!session) {
        throw new Error("Sesi tidak ditemukan.");
    }

    if (session.status !== "preview") {
        throw new Error(`Sesi berstatus "${session.status}", cuma bisa direvisi dari status "preview".`);
    }

    const settings = getSettings();

    const revised = await askGroq(
        [
            {
                role: "system",
                content:
                    "Kamu adalah LINA. Di bawah ada draft hasil tugas yang sudah ada, dan feedback " +
                    "revisi dari pengguna. Tulis ulang draftnya supaya sesuai feedback itu. Balas HANYA " +
                    "teks hasil revisi final dalam Bahasa Indonesia — tanpa embel-embel seperti " +
                    "'berikut hasil revisinya' atau catatan soal proses revisi."
            },
            {
                role: "user",
                content: `Draft saat ini:\n${currentText}\n\nFeedback/revisi yang diminta:\n${feedback}`
            }
        ],
        new AbortController().signal,
        { model: settings.model, effort: settings.effort, jsonMode: false }
    );

    session.summary = revised.trim();
    emit(session);

    return session;
}

/**
 * Finalisasi hasil Agent Mode setelah pengguna meninjau/mengedit preview-nya.
 * Teks yang dikirim dianggap final apa adanya (gak diproses ulang LLM), lalu
 * dipush ke Telegram kalau sudah dikonfigurasi.
 */
export async function finalizeAgentSession(id: string, finalText: string): Promise<AgentSession> {
    const session = sessions.get(id);

    if (!session) {
        throw new Error("Sesi tidak ditemukan.");
    }

    if (session.status !== "preview") {
        throw new Error(`Sesi berstatus "${session.status}", cuma bisa difinalisasi dari status "preview".`);
    }

    session.summary = finalText.trim();
    session.status = "done";
    emit(session);

    await sendTelegramMessage(session.summary);

    return session;
}
