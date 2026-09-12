import { pipeline, cos_sim } from "@xenova/transformers";

/**
 * Satu instance model embedding dipakai bareng oleh memory.ts (ingatan) dan
 * vaultIndex.ts (pencarian catatan Obsidian) — biar modelnya cuma di-load
 * sekali, bukan dobel (tiap load makan waktu beberapa detik).
 */
let extractor: any = null;

export async function loadEmbeddingModel() {
    if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
    }
    return extractor;
}

export async function embed(text: string) {
    const model = await loadEmbeddingModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return output.data;
}

export { cos_sim };
