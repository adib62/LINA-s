export type Provider = "groq" | "ollama";

export interface ModelInfo {
    /** ID yang dikirim ke provider. */
    id: string;
    /** Nama yang tampil di UI. */
    label: string;
    provider: Provider;
    /** Catatan singkat buat tooltip di UI. */
    note?: string;
}

/**
 * Model yang tersedia untuk dipilih dari model selector di UI.
 * Tambah entri di sini kalau mau nambah model — UI otomatis ikut.
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
    {
        id: "openai/gpt-oss-20b",
        label: "GPT-OSS 20B",
        provider: "groq",
        note: "Cepat, tapi kadang kewalahan sama system prompt yang udah cukup panjang"
    },
    {
        id: "openai/gpt-oss-120b",
        label: "GPT-OSS 120B",
        provider: "groq",
        note: "Default — lebih pintar & konsisten, lebih lambat dikit"
    },
    {
        id: "qwen/qwen3.8-27b",
        label: "Qwen 3.8 27B",
        provider: "groq",
        note: "Bagus buat reasoning"
    },
    {
        id: "qwen/qwen3.6-27b",
        label: "Qwen 3.6 27B",
        provider: "groq",
        note: "Versi sebelumnya, lebih ringan"
    },
    {
        id: "groq/compound",
        label: "Groq Compound",
        provider: "groq",
        note: "Multi-step, bisa browsing/tools bawaan Groq"
    }
];

export function findModel(id: string): ModelInfo | undefined {
    return AVAILABLE_MODELS.find(m => m.id === id);
}

/**
 * Effort menentukan seberapa "keras" LINA mikir.
 * Dipakai frontend juga: cuma effort "high" yang nampilin timer Thinking.
 */
export const EFFORT_PRESET = {
    low: { temperature: 0.2, maxTokens: 512 },
    medium: { temperature: 0.3, maxTokens: 1024 },
    high: { temperature: 0.5, maxTokens: 4096 }
} as const;
