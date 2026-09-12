import * as fs from "fs";
import * as path from "path";

import { askGroq } from "./groq";
import { getSettings } from "./settings";
import { broadcast } from "../websocket/websocket";
import { generateVoice } from "./voicevox";
import { parseGroqResponse } from "../utils/json";
import { jarakWaktu } from "../utils/datetime";
import { logError, logInfo } from "../utils/logger";
import { readPrompt } from "../prompts/buildPrompt";
import { dueReminders, markNotified as markReminderNotified, Reminder } from "./reminder";
import { upcomingEvents, markNotified as markEventNotified, CalendarEvent } from "./calendar";

/* =====================================================================
   KONFIGURASI
   ===================================================================== */

/** Seberapa sering scheduler jalan. Spec: mulai dari 1-5 menit. */
const TICK_MS = 60 * 1000;

/** Reminder dicek maju sejauh satu tick, supaya tidak ada yang kelewat di antara dua putaran. */
const REMINDER_LEAD_MS = TICK_MS;

/** Event kalender diberi tahu 15 menit sebelum mulai (contoh dari spec). */
const CALENDAR_LEAD_MS = 15 * 60 * 1000;

/** Maksimal 1 notifikasi per 10 menit, kecuali ada yang urgent. */
const RATE_LIMIT_MS = 10 * 60 * 1000;

/** Event dianggap urgent kalau mulai dalam 5 menit ke depan. */
const CALENDAR_URGENT_MS = 5 * 60 * 1000;

/* =====================================================================
   STATE — kapan terakhir kali benar-benar mendorong notifikasi.
   Disimpan ke disk supaya restart backend tidak mereset rate limit.
   ===================================================================== */

interface SchedulerState {
    lastNotifyAt: number;
}

const statePath = path.join(process.cwd(), "src", "data", "scheduler-state.json");

function loadState(): SchedulerState {
    try {
        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, "utf-8"));
        }
    } catch {
        /* file rusak atau belum ada — pakai default */
    }
    return { lastNotifyAt: 0 };
}

function saveState(state: SchedulerState): void {
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 4));
}

let state = loadState();

/* =====================================================================
   CANDIDATE — bentuk seragam dari checker manapun sebelum masuk decision logic
   ===================================================================== */

interface Candidate {
    kind: "reminder" | "calendar";
    id: string;
    /** Kalimat mentah yang dikirim ke AI core sebagai bahan, bukan hasil akhir. */
    context: string;
    urgent: boolean;
}

/* =====================================================================
   CHECKERS
   ===================================================================== */

function checkReminder(): { shouldNotify: boolean; candidates: Candidate[] } {
    const items: Reminder[] = dueReminders(REMINDER_LEAD_MS);

    const candidates: Candidate[] = items.map(r => ({
        kind: "reminder",
        id: r.id,
        urgent: r.dueAt <= Date.now(),
        context: `Pengingat "${r.text}" (${jarakWaktu(r.dueAt)}).`
    }));

    return { shouldNotify: candidates.length > 0, candidates };
}

function checkCalendar(): { shouldNotify: boolean; candidates: Candidate[] } {
    const items: CalendarEvent[] = upcomingEvents(CALENDAR_LEAD_MS);

    const candidates: Candidate[] = items.map(e => ({
        kind: "calendar",
        id: e.id,
        urgent: e.startAt - Date.now() <= CALENDAR_URGENT_MS,
        context:
            `Jadwal "${e.title}" ${jarakWaktu(e.startAt)}` +
            (e.location ? ` di ${e.location}` : "") + "."
    }));

    return { shouldNotify: candidates.length > 0, candidates };
}

/* =====================================================================
   AI CORE — generate pesan natural pakai personality LINA.
   Sengaja TIDAK memuat daftar tool: sistem inisiatif tidak boleh
   memanggil tool reaktif (office, dsb), cuma boleh bicara.
   ===================================================================== */

async function generateNotificationMessage(candidates: Candidate[]): Promise<{ indo: string; jepang: string }> {
    const settings = getSettings();
    const personality = readPrompt("personality");
    const japanese = readPrompt("japanes");

    const daftar = candidates.map(c => `- ${c.context}`).join("\n");

    const systemPrompt = `
${personality}
${japanese}

KONTEKS SAAT INI:

Kamu baru teringat sendiri hal-hal berikut dan ingin menyampaikannya
ke pengguna TANPA diminta lebih dulu:

${daftar}

Sampaikan secara natural, singkat, dan hangat sesuai kepribadianmu.
Jangan pakai kata "notifikasi", "sistem", atau "pengingat otomatis" —
anggap ini benar-benar hal yang baru kamu ingat sendiri.
Kalau lebih dari satu hal, gabungkan jadi satu kalimat yang enak dibaca,
jangan didaftar satu-satu pakai bullet.

WAJIB balas HANYA JSON dengan bentuk:
{"indo":"...","jepang":"..."}
`.trim();

    const raw = await askGroq(
        [{ role: "system", content: systemPrompt }],
        new AbortController().signal,
        { model: settings.model, effort: "low", jsonMode: true }
    );

    const parsed = parseGroqResponse(raw);

    if (parsed?.indo) {
        return { indo: parsed.indo, jepang: parsed.jepang || parsed.indo };
    }

    // Fallback kalau LLM ngaco — tetap kasih tahu pengguna, jangan diam saja
    const fallback = candidates.map(c => c.context).join(" ");
    return { indo: fallback, jepang: fallback };
}

/* =====================================================================
   PUSH MECHANISM
   ===================================================================== */

async function pushNotification(candidates: Candidate[]): Promise<void> {
    const settings = getSettings();
    const { indo, jepang } = await generateNotificationMessage(candidates);

    let audioBase64 = "";

    if (settings.autoSpeak) {
        try {
            audioBase64 = await generateVoice(jepang, settings.speakerId, new AbortController().signal);
        } catch (error) {
            logError("Scheduler: VoiceVox gagal, notifikasi dikirim tanpa audio.", error);
        }
    }

    broadcast({
        status: "INITIATIVE",
        indo,
        jepang,
        audioBase64,
        items: candidates.map(c => ({ kind: c.kind, id: c.id, context: c.context }))
    });

    logInfo(`🔔 Inisiatif terkirim: ${indo}`);
}

/* =====================================================================
   DECISION LOGIC
   ===================================================================== */

let ticking = false;

async function runCycle(): Promise<void> {
    // Jangan tumpang tindih kalau satu putaran belum selesai (misal VoiceVox lambat)
    if (ticking) return;
    ticking = true;

    try {
        const settings = getSettings();

        if (!settings.initiativeEnabled) return;

        const reminderResult = checkReminder();
        const calendarResult = checkCalendar();

        const candidates = [...reminderResult.candidates, ...calendarResult.candidates];

        if (candidates.length === 0) return;

        const urgent = candidates.some(c => c.urgent);
        const now = Date.now();
        const sejakTerakhir = now - state.lastNotifyAt;

        if (!urgent && sejakTerakhir < RATE_LIMIT_MS) {
            // Belum waktunya notif lagi. Candidate TIDAK ditandai notified,
            // jadi akan dicoba ulang di tick berikutnya — dan kalau sudah
            // semakin dekat/lewat, bisa jadi urgent dan menembus rate limit.
            logInfo(
                `🔕 Inisiatif ditahan (rate limit), ${candidates.length} item menunggu.`
            );
            return;
        }

        await pushNotification(candidates);

        for (const c of candidates) {
            if (c.kind === "reminder") markReminderNotified(c.id);
            else markEventNotified(c.id);
        }

        state = { lastNotifyAt: now };
        saveState(state);

    } catch (error) {
        logError("Scheduler gagal jalan satu putaran.", error);
    } finally {
        ticking = false;
    }
}

/* =====================================================================
   LIFECYCLE
   ===================================================================== */

let timer: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
    if (timer) return; // sudah jalan

    timer = setInterval(runCycle, TICK_MS);
    logInfo(`⏰ Scheduler inisiatif aktif, interval ${TICK_MS / 1000} detik.`);
}

export function stopScheduler(): void {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

/** Dipakai endpoint/tool buat trigger manual pas testing, di luar jadwal. */
export function runSchedulerOnce(): Promise<void> {
    return runCycle();
}
