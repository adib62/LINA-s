import * as fs from "fs";
import * as path from "path";
import { pipeline, cos_sim } from "@xenova/transformers";
import { syncMemoryToObsidian } from "./obsidianSync";

let extractor: any = null;

let memoryVectors: {
    text: string;
    embedding: any;
}[] = [];

/**
 * Ingatan bisa berupa string polos (lama, sebelum ada sistem topik — tetap
 * "lepas" di Obsidian, gak dipaksa masuk induk manapun) atau objek dengan
 * topik (baru — dikelompokkan di bawah 1 note induk per topik di Obsidian).
 */
export type MemoryEntry = string | { text: string; topic: string };

export function entryText(entry: MemoryEntry): string {
    return typeof entry === "string" ? entry : entry.text;
}

const memoryFilePath =
path.join(process.cwd(),
"src",
"data",
"memory.json"
);

export async function initMemory() {
    console.log("⏳ Memuat model Semantic Embedding L.I.N.A (Xenova/all-MiniLM-L6-v2)...");
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });

    // Pastiin folder src/data/ ada dulu — sebelumnya langsung writeFileSync
    // tanpa cek folder, jadi error ENOENT kalau backend baru pertama kali dijalankan
    const dataDir = path.dirname(memoryFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Cek apakah file memory.json sudah ada, kalau belum, buatkan file kosong
    if (!fs.existsSync(memoryFilePath)) {
        fs.writeFileSync(
            memoryFilePath,
            JSON.stringify(
                [],
                null,
                4
            ));

        console.log("📁 File memory.json berhasil dibuat.");
    }

    // Baca data ingatan dari file external memory.json
    const rawData = fs.readFileSync(memoryFilePath, 'utf-8');
    const catatanMemori: MemoryEntry[] = JSON.parse(rawData);

    for (const entry of catatanMemori) {
        const teks = entryText(entry);
        const output = await extractor(teks, { pooling: 'mean', normalize: true });
        memoryVectors.push({ text: teks, embedding: output.data });
    }
    console.log(`✅ Memori lokal L.I.N.A berhasil di-index! (${catatanMemori.length} ingatan dimuat)`);

    syncMemoryToObsidian(catatanMemori);
}

export async function searchMemory(pesan: string):Promise<string> {

    let konteksRelevan = "";

    if (!extractor || memoryVectors.length === 0) {
        return "";
    }

    const queryEmbedding = await extractor(pesan, {
        pooling: "mean",
        normalize: true
    });

    const hasilPencarian = memoryVectors.map(mem => {
        const score = cos_sim(queryEmbedding.data, mem.embedding);

        return {
            text: mem.text,
            score
        };
    });

    hasilPencarian.sort((a, b) => b.score - a.score);

    if (hasilPencarian[0]?.score > 0.30) {
        const topMemories = hasilPencarian.filter(mem => mem.score > 0.30).slice(0, 3);

        konteksRelevan = topMemories.map(mem => `- ${mem.text}`).join("\n")

        if (konteksRelevan !=="") {
            console.log("Top Memory:");
            console.log(konteksRelevan);
        }
    }

    return konteksRelevan;
}

export async function updateMemory(
    action: string,
    oldMemory: string,
    newMemory: string,
    topic: string = ""
){
    // LOGIKA PENYIMPANAN OTOMATIS
    try {

        switch (action) {
            case "add":{

                //validasi sebelum di cek duplicate
                if (!newMemory || newMemory.trim() === "") {
                    console.log("⚠️ Ingatan baru kosong, tidak disimpan.");
                    break;
                }
                //push memory

                //jika sudah ada di memory lina tidak akan menyimpan ulang data yang sama
                const currentData: MemoryEntry[] = JSON.parse(fs.readFileSync(memoryFilePath, 'utf-8'));

                const sudahAda = currentData.some(m => entryText(m).toLowerCase() === newMemory.toLowerCase());

                if (sudahAda) {
                    console.log("⚠️ Ingatan baru sudah ada di memory.json, tidak disimpan ulang.");
                    break;
                }

                const entryBaru: MemoryEntry = topic && topic.trim() !== ""
                    ? { text: newMemory, topic: topic.trim() }
                    : newMemory;

                currentData.push(entryBaru);
                fs.writeFileSync(memoryFilePath, JSON.stringify(currentData, null, 4));

                const embedding = await extractor(newMemory, { pooling: "mean", normalize: true });

                memoryVectors.push({ text: newMemory, embedding: embedding.data });

                console.log(
                    `💾 Ingatan baru berhasil disimpan ke memory.json: "${newMemory}"` +
                    (topic ? ` (topik: ${topic})` : "")
                );
                syncMemoryToObsidian(currentData);

                break;
            }

            case "replace": {
                //replace memory lama
                //ganti
                const currentData: MemoryEntry[] = JSON.parse(fs.readFileSync(memoryFilePath, 'utf-8'));

                const index = currentData.findIndex(m => entryText(m) === oldMemory);

                if (index !== -1) {
                    const lama = currentData[index];
                    // Kalau topik baru gak dikasih, pertahankan topik lama (kalau ada)
                    // biar ingatan yang direvisi gak "keluar" dari induknya sendiri.
                    const topikDipakai = topic && topic.trim() !== ""
                        ? topic.trim()
                        : (typeof lama === "object" ? lama.topic : "");

                    currentData[index] = topikDipakai ? { text: newMemory, topic: topikDipakai } : newMemory;
                    fs.writeFileSync(memoryFilePath, JSON.stringify(currentData, null, 4));
                }

                memoryVectors = [];

                const semuaMemory: MemoryEntry[] = JSON.parse(fs.readFileSync(memoryFilePath, 'utf-8'));
                for (const m of semuaMemory) {
                    const teks = entryText(m);
                    const emb = await extractor(teks, { pooling: 'mean', normalize: true });
                    memoryVectors.push({ text: teks, embedding: emb.data });
                }

                console.log("💾 Memory Update");
                syncMemoryToObsidian(semuaMemory);
                break;
            }

            case "none": {
                break;
            }

            default:
                console.log(`action tidak dikenal: ${action}`);
                break;
        }

    } catch (error) {
        console.error("Gagal update memory", error);
    }
}
