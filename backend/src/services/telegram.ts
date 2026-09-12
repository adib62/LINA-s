import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "../config/env";
import { logError, logInfo } from "../utils/logger";

/** Batas Telegram per pesan; dipotong jadi beberapa bagian kalau lebih panjang. */
const CHUNK_SIZE = 3500;

function pecahJadiChunk(teks: string): string[] {
    if (teks.length <= CHUNK_SIZE) return [teks];

    const chunks: string[] = [];
    for (let i = 0; i < teks.length; i += CHUNK_SIZE) {
        chunks.push(teks.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
}

async function kirimSatuPesan(teks: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: teks })
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Telegram API error ${response.status}: ${body}`);
    }
}

/**
 * Kirim hasil final Agent Mode ke Telegram. Diam-diam skip (cuma log warning)
 * kalau TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID belum diisi di .env — biar backend
 * tetap jalan normal buat yang gak butuh fitur ini.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        logInfo("Telegram belum dikonfigurasi (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID kosong), lewati kirim.");
        return;
    }

    try {
        for (const chunk of pecahJadiChunk(text)) {
            await kirimSatuPesan(chunk);
        }
        logInfo("Hasil final Agent Mode terkirim ke Telegram.");
    } catch (error) {
        logError("Gagal kirim ke Telegram.", error);
    }
}
