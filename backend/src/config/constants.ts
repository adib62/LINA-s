export const DEFAULT_SPEAKER = 46;

export const VOICE_SPEED = 1.4;

export const DEFAULT_JAPANESE = "こんにちは";

// gpt-oss-20b kadang kewalahan sama system prompt LINA yang udah cukup panjang
// (rules + daftar tool + personality + memory) dan malah echo balik pesan user
// apa adanya alih-alih jawab natural — ketauan pas tes langsung. 120b konsisten.
export const GROQ_MODEL = "openai/gpt-oss-120b";

export const GROQ_TEMPERATURE = 0.3;

/** Batas waktu satu panggilan Groq sebelum dianggap kelamaan dan digagalkan. */
export const GROQ_TIMEOUT_MS = 30_000;

export const MAX_HISTORY = 40;

export const DEFAULT_INDONESIAN = "Maaf, sistem memproses.";

/**
 * Tools yang gak disuntik ke system prompt Voice Mode — hasilnya berupa file
 * (Word/PPT/PDF), gak ada gunanya di voice karena gak ada UI buat nampilin link
 * download. Dikeluarin biar prompt voice mode lebih ringkas & cepat.
 * Tetap tersedia penuh di Chat Mode.
 */
export const VOICE_EXCLUDED_TOOLS = ["document.manage"];