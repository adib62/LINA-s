import fs from "fs";
import path from "path";
import { registry } from "../tools/registry";

/**
 * Kalau env PROMPTS_DIR di-set (path ke folder di dalam vault Obsidian),
 * prompt dibaca dari sana. Kalau file-nya belum ada di vault atau
 * PROMPTS_DIR tidak di-set, jatuh balik ke bundel bawaan (.txt di folder ini)
 * supaya backend tetap jalan walau vault belum disiapkan.
 *
 * Dibaca ulang dari disk tiap kali dipanggil (tidak di-cache), jadi edit
 * di Obsidian langsung kepakai di pesan berikutnya tanpa restart backend.
 */
function readPrompt(name: string): string {
    const vaultDir = process.env.PROMPTS_DIR?.trim();

    if (vaultDir) {
        const vaultPath = path.join(vaultDir, `${name}.md`);
        if (fs.existsSync(vaultPath)) {
            return stripFrontmatter(fs.readFileSync(vaultPath, "utf-8"));
        }
    }

    return fs.readFileSync(path.join(__dirname, `${name}.txt`), "utf-8");
}

/** Buang blok YAML frontmatter Obsidian (---\n...\n---) biar tidak ikut kekirim ke LLM. */
function stripFrontmatter(text: string): string {
    return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

/** Buat log startup — biar jelas prompt lagi dibaca dari mana. */
export function promptsSourceInfo(): string {
    const vaultDir = process.env.PROMPTS_DIR?.trim();

    if (vaultDir && fs.existsSync(vaultDir)) {
        return `vault Obsidian (${vaultDir})`;
    }
    if (vaultDir) {
        return `PROMPTS_DIR diset ke "${vaultDir}" tapi folder tidak ditemukan — pakai bundel bawaan`;
    }
    return "bundel bawaan (src/prompts/*.txt)";
}

/** Dipakai juga oleh scheduler.ts, biar prompt notifikasi ikut sumber yang sama. */
export { readPrompt };

export function buildPrompt(
    waktu: string,
    konteks: string,
    excludeTools: string[] = []
){
    // Instruksi & contoh format tool document.manage ada di file terpisah
    // (office-tools.txt/.md) biar bisa gampang dicoret dari voice mode tanpa bongkar rules.txt.
    const sertakanOfficeDocs = !excludeTools.includes("document.manage");

    return `
    ${readPrompt("system")}
    ${readPrompt("rules")}
    ${sertakanOfficeDocs ? readPrompt("office-tools") : ""}
    ${readPrompt("personality")}
    ${readPrompt("memory")}
    ${readPrompt("japanes")}

    TOOLS TERSEDIA:

    ${registry.buildPrompt(excludeTools)}

    INFORMASI SISTEM:
    -Waktu: ${waktu}
    
    ${konteks ? `INFO ADIB:\n${konteks}`:""}`;
}
