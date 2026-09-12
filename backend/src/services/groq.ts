import Groq from "groq-sdk";
import { GROQ_API_KEY } from "../config/env";
import { GROQ_MODEL, GROQ_TEMPERATURE, GROQ_TIMEOUT_MS } from "../config/constants";
import { EFFORT_PRESET } from "../config/models";
import { ChatMessage } from "./history";
import { Effort } from "./settings";

const groq = new Groq({
    apiKey: GROQ_API_KEY
});

/** Model "openai/gpt-oss-*" dukung parameter reasoning_effort di Groq. */
function isGptOss(model: string): boolean {
    return model.startsWith("openai/gpt-oss");
}

export interface AskOptions {
    model?: string;
    effort?: Effort;
    /** Kalau false, jawaban bebas (dipakai sub-agent yang gak butuh JSON). */
    jsonMode?: boolean;
}

/** Berapa detik nunggu sebelum retry kalau kena rate limit (429), dibatasi biar gak nunggu semenit penuh. */
const RATE_LIMIT_MAX_WAIT_MS = 15_000;
const RATE_LIMIT_MAX_RETRIES = 1;

function tidur(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason);

        const timer = setTimeout(resolve, ms);
        signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(signal.reason);
        }, { once: true });
    });
}

/** Ambil saran waktu tunggu dari header `retry-after` Groq (detik), fallback ke default. */
function retryDelayFrom(error: unknown): number {
    const headers = (error as { headers?: Headers })?.headers;
    const raw = headers?.get?.("retry-after");
    const detik = raw ? parseFloat(raw) : NaN;

    if (!Number.isFinite(detik) || detik <= 0) return 2_000;
    return Math.min(detik * 1000, RATE_LIMIT_MAX_WAIT_MS);
}

async function attemptGroqCall(
    messages: ChatMessage[],
    signal: AbortSignal,
    model: string,
    effort: Effort,
    jsonMode: boolean
): Promise<string> {

    const preset = EFFORT_PRESET[effort];

    // Gabung sinyal abort dari caller (mis. barge-in) dengan timeout keras kita sendiri,
    // biar kalau Groq lagi lambat/ngantre, request gagal cepat dengan pesan jelas
    // ketimbang nunggu retry bawaan SDK berkali-kali.
    const timeoutSignal = AbortSignal.timeout(GROQ_TIMEOUT_MS);
    const combinedSignal = AbortSignal.any([signal, timeoutSignal]);

    try {
        const chatCompletion = await groq.chat.completions.create(
            {
                messages,
                model,
                temperature: preset?.temperature ?? GROQ_TEMPERATURE,
                max_tokens: preset?.maxTokens ?? 1024,
                // Kontrol seberapa lama model "mikir" sebelum jawab — lever asli buat kecepatan,
                // beda dari preset effort LINA yang cuma ngatur temperature/max_tokens.
                ...(isGptOss(model) ? { reasoning_effort: effort } : {}),
                ...(jsonMode
                    ? { response_format: { type: "json_object" as const } }
                    : {})
            },
            { signal: combinedSignal, maxRetries: 1 }
        );

        return chatCompletion.choices[0]?.message?.content || (jsonMode ? "{}" : "");
    } catch (error) {
        // Abort asli dari caller (pesan baru masuk) harus tetap kelihatan sebagai abort biasa.
        if (signal.aborted) throw error;

        if (timeoutSignal.aborted) {
            throw new Error(
                `Model "${model}" kelamaan mikir (>${GROQ_TIMEOUT_MS / 1000}s). Coba lagi atau pilih model yang lebih cepat.`
            );
        }

        throw error;
    }
}

export async function askGroq(
    messages: ChatMessage[],
    signal: AbortSignal,
    options: AskOptions = {}
): Promise<string> {

    const model = options.model || GROQ_MODEL;
    const effort = options.effort ?? "medium";
    const jsonMode = options.jsonMode !== false;

    for (let attempt = 0; ; attempt++) {
        try {
            return await attemptGroqCall(messages, signal, model, effort, jsonMode);
        } catch (error) {
            const kenaLimit = error instanceof Groq.RateLimitError;

            if (!kenaLimit || attempt >= RATE_LIMIT_MAX_RETRIES || signal.aborted) {
                if (kenaLimit) {
                    throw new Error(
                        `Model "${model}" lagi kena rate limit Groq. Coba lagi sebentar atau pilih model lain.`
                    );
                }
                throw error;
            }

            // Kena 429: tunggu sesuai saran Groq (atau default), lalu coba sekali lagi.
            await tidur(retryDelayFrom(error), signal);
        }
    }
}

export { groq };
