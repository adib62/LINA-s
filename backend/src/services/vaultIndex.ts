import * as fs from "fs";
import * as path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { embed, cos_sim } from "./embeddings";
import { logError, logInfo } from "../utils/logger";

/** Batas karakter per note yang diembed — cukup buat konteks, gak bikin prompt membengkak. */
const MAX_CHARS = 2000;

/**
 * File/folder milik LINA sendiri (config prompt + note ingatan yang udah
 * di-cover lewat searchMemory) — dikecualikan biar gak double-index/muter balik.
 */
const EXCLUDED_ROOT_FILES = new Set([
    "system.md", "rules.md", "personality.md", "memory.md", "japanes.md",
    "office-tools.md", "report-style.md", "LINA Memory Index.md", "README.md"
]);
const EXCLUDED_DIRS = new Set(["LINA Memory"]);

interface VaultNote {
    relPath: string;
    text: string;
    embedding: any;
}

let notes: VaultNote[] = [];
let watcher: FSWatcher | null = null;

/** Diekspor juga biar dipakai skrip lain (misal importVaultNotes.ts) tanpa duplikat logic. */
export function isExcluded(relPath: string): boolean {
    const parts = relPath.split(path.sep);
    if (parts.length === 1 && EXCLUDED_ROOT_FILES.has(parts[0])) return true;
    if (parts.some(p => EXCLUDED_DIRS.has(p))) return true;
    return false;
}

/** Buang blok frontmatter YAML (---...---) sama kayak buildPrompt.ts. */
export function stripFrontmatter(text: string): string {
    return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

async function indexFile(vaultDir: string, absPath: string): Promise<void> {
    const relPath = path.relative(vaultDir, absPath);
    if (isExcluded(relPath)) return;

    try {
        const raw = fs.readFileSync(absPath, "utf-8");
        const teks = stripFrontmatter(raw).slice(0, MAX_CHARS).trim();

        if (!teks) {
            notes = notes.filter(n => n.relPath !== relPath);
            return;
        }

        const embedding = await embed(teks);
        notes = notes.filter(n => n.relPath !== relPath);
        notes.push({ relPath, text: teks, embedding });
    } catch (error) {
        logError(`Gagal index catatan vault: ${relPath}`, error);
    }
}

function removeFile(vaultDir: string, absPath: string): void {
    const relPath = path.relative(vaultDir, absPath);
    notes = notes.filter(n => n.relPath !== relPath);
}

/**
 * Nyalain indexer real-time atas seluruh catatan di vault Obsidian (di luar
 * file config/ingatan LINA sendiri). Diam-diam di-skip kalau PROMPTS_DIR
 * belum di-set — fitur ini opsional, gak boleh bikin backend gagal jalan.
 */
export function initVaultIndex(): void {
    const vaultDirRaw = process.env.PROMPTS_DIR?.trim();
    if (!vaultDirRaw || !fs.existsSync(vaultDirRaw)) return;

    if (watcher) return; // udah jalan

    // chokidar (v4+) gak lagi parse glob pattern & butuh forward slash biar
    // path Windows (backslash) kebaca bener — makanya dua-duanya di sini.
    const vaultDir = vaultDirRaw;
    const watchTarget = vaultDir.replace(/\\/g, "/");

    watcher = chokidar.watch(watchTarget, {
        ignoreInitial: false,
        awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 }
    });

    const isMarkdown = (p: string) => p.toLowerCase().endsWith(".md");

    watcher
        .on("add", (absPath: string) => { if (isMarkdown(absPath)) indexFile(vaultDir, absPath); })
        .on("change", (absPath: string) => { if (isMarkdown(absPath)) indexFile(vaultDir, absPath); })
        .on("unlink", (absPath: string) => { if (isMarkdown(absPath)) removeFile(vaultDir, absPath); })
        .on("ready", () => {
            logInfo(`📚 Vault index siap — ${notes.length} catatan dari Obsidian ter-index (real-time).`);
        })
        .on("error", (error: unknown) => logError("Vault watcher error.", error));
}

export function stopVaultIndex(): void {
    watcher?.close();
    watcher = null;
    notes = [];
}

/**
 * Cari catatan vault yang relevan sama pesan, mirip searchMemory tapi buat
 * catatan bebas (bukan fakta terstruktur) — hasilnya diberi label jelas biar
 * LLM tau ini "catatan pengguna", bukan ingatan yang udah dikonfirmasi.
 */
export async function searchVault(pesan: string): Promise<string> {
    if (notes.length === 0) return "";

    const queryEmbedding = await embed(pesan);

    const hasil = notes
        .map(n => ({ ...n, score: cos_sim(queryEmbedding, n.embedding) }))
        .sort((a, b) => b.score - a.score);

    const relevan = hasil.filter(n => n.score > 0.30).slice(0, 3);
    if (relevan.length === 0) return "";

    return relevan.map(n => `[${n.relPath}]\n${n.text}`).join("\n\n");
}
