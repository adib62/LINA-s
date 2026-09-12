import * as fs from "fs";
import * as path from "path";
import { logError } from "../utils/logger";

/** Buang karakter yang gak boleh dipakai di nama file Windows/Obsidian. */
function slugify(text: string, maxLen = 40): string {
    return text
        .trim()
        .slice(0, maxLen)
        .replace(/[\\/:*?"<>|#^[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Tulis ulang seluruh ingatan jangka panjang LINA sebagai note Obsidian yang
 * saling terhubung: satu note per ingatan (dirantai ke sebelumnya/selanjutnya)
 * plus satu note index/hub yang nge-link ke semuanya.
 *
 * Dipanggil real-time tiap memory.json berubah (add/replace) — bukan nunggu
 * diminta. Diam-diam di-skip kalau PROMPTS_DIR belum di-set/foldernya gak ada,
 * sama seperti fitur Obsidian lain di project ini — opsional, gak boleh bikin
 * penyimpanan memori gagal cuma gara-gara vault belum disiapkan.
 */
export function syncMemoryToObsidian(memories: string[]): void {
    const vaultDir = process.env.PROMPTS_DIR?.trim();
    if (!vaultDir || !fs.existsSync(vaultDir)) return;

    try {
        const memoryDir = path.join(vaultDir, "LINA Memory");
        if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });

        const entries = memories.map((teks, i) => {
            const num = String(i + 1).padStart(3, "0");
            const slug = slugify(teks) || "ingatan";
            return { num, slug, teks, baseName: `${num} - ${slug}` };
        });

        // Bersihin note lama yang gak ada lagi di daftar sekarang (jaga-jaga kalau
        // suatu saat ada fitur hapus memori) — biar folder gak numpuk sampah.
        const namaFileValid = new Set(entries.map(e => `${e.baseName}.md`));
        for (const f of fs.readdirSync(memoryDir)) {
            if (f.endsWith(".md") && !namaFileValid.has(f)) {
                fs.unlinkSync(path.join(memoryDir, f));
            }
        }

        entries.forEach((entry, i) => {
            const prev = entries[i - 1];
            const next = entries[i + 1];

            const nav = [
                "[[LINA Memory Index|↑ index]]",
                prev ? `[[LINA Memory/${prev.baseName}|← sebelumnya]]` : null,
                next ? `[[LINA Memory/${next.baseName}|selanjutnya →]]` : null
            ].filter(Boolean).join(" · ");

            const content = `# Ingatan ${entry.num}\n\n${entry.teks}\n\n---\n\n${nav}\n`;

            fs.writeFileSync(path.join(memoryDir, `${entry.baseName}.md`), content, "utf-8");
        });

        const indexLines = entries.map(e => `- [[LINA Memory/${e.baseName}|${e.slug}]]`);
        const indexContent =
            "# LINA — Ingatan Jangka Panjang\n\n" +
            "Auto-generated oleh LINA tiap ada ingatan baru/berubah — edit manual di sini " +
            "akan ketimpa. Buat ubah ingatan, ngobrol langsung sama LINA.\n\n" +
            (indexLines.length > 0 ? indexLines.join("\n") : "_Belum ada ingatan tersimpan._") + "\n";

        fs.writeFileSync(path.join(vaultDir, "LINA Memory Index.md"), indexContent, "utf-8");

    } catch (error) {
        logError("Gagal sync memori ke Obsidian.", error);
    }
}
