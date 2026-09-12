import * as dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY belum diatur.")
}
export const VOICEVOX_API_URL = process.env.VOICEVOX_API_URL || 'http://127.0.0.1:50021';

// Opsional — kalau kosong, hasil final Agent Mode gak dikirim ke Telegram (fitur nonaktif diam-diam).
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';