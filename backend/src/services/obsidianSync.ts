import * as fs from "fs";
import * as path from "path";
import { logError } from "../utils/logger";

/**
 * Duplikat ringan dari tipe di memory.ts — sengaja gak import dari situ biar
 * gak muter balik jadi circular import (memory.ts -> obsidianSync.ts).
 */
type MemoryEntry = string | { text: string; topic: string };

function entryText(entry: MemoryEntry): string {
    return typeof entry === "string" ? entry : entry.text;
}

function entryTopic(entry: MemoryEntry): string | null {
    return typeof entry === "string" ? null : (entry.topic?.trim() || null);
}

/** Buang karakter yang gak boleh dipakai di nama file Windows/Obsidian. */
function slugify(text: string, maxLen = 40): string {
    return text
        .trim()
        .slice(0, maxLen)
        .replace(/[\\/:*?"<>|#^[\]]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function kosongkanFolder(dir: string): void {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
        else fs.unlinkSync(full);
    }
}

/**
 * Tulis ulang seluruh ingatan jangka panjang LINA sebagai note Obsidian yang
 * saling terhubung, 2 level:
 *
 * - Ingatan yang punya topik (dikasih LLM tiap nyimpen) dikelompokkan di bawah
 *   satu note INDUK per topik (folder `LINA Memory/<topik>/`), tiap ingatan
 *   jadi note ANAK yang nge-link balik ke induknya.
 * - Ingatan lama tanpa topik (dibuat sebelum sistem ini ada) tetap "lepas" —
 *   dirantai ke sebelumnya/selanjutnya kayak sebelumnya, gak dipaksa masuk
 *   induk manapun.
 * - Satu note index (`LINA Memory Index.md`) nge-link ke semua induk topik
 *   dan semua ingatan lepas.
 *
 * Dipanggil real-time tiap memory.json berubah (add/replace) — bukan nunggu
 * diminta. Diam-diam di-skip kalau PROMPTS_DIR belum di-set/foldernya gak ada.
 */
export function syncMemoryToObsidian(memories: MemoryEntry[]): void {
    const vaultDir = process.env.PROMPTS_DIR?.trim();
    if (!vaultDir || !fs.existsSync(vaultDir)) return;

    try {
        const memoryDir = path.join(vaultDir, "LINA Memory");
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
        } else {
            kosongkanFolder(memoryDir);
        }

        const lepas = memories.filter(m => entryTopic(m) === null);

        // Kelompokkan berdasarkan topik — kunci dinormalisasi (lowercase+trim)
        // biar topik yang cuma beda kapital gak kepecah jadi induk yang beda.
        const kelompokTopik = new Map<string, { judul: string; items: MemoryEntry[] }>();
        for (const m of memories) {
            const topik = entryTopic(m);
            if (!topik) continue;
            const kunci = topik.toLowerCase();
            if (!kelompokTopik.has(kunci)) kelompokTopik.set(kunci, { judul: topik, items: [] });
            kelompokTopik.get(kunci)!.items.push(m);
        }

        // --- ingatan lepas: dirantai sebelumnya/selanjutnya ---
        const catatanLepas = lepas.map((m, i) => {
            const num = String(i + 1).padStart(3, "0");
            const slug = slugify(entryText(m)) || "ingatan";
            return { num, slug, teks: entryText(m), baseName: `${num} - ${slug}` };
        });

        catatanLepas.forEach((entry, i) => {
            const prev = catatanLepas[i - 1];
            const next = catatanLepas[i + 1];

            const nav = [
                "[[LINA Memory Index|↑ index]]",
                prev ? `[[LINA Memory/${prev.baseName}|← sebelumnya]]` : null,
                next ? `[[LINA Memory/${next.baseName}|selanjutnya →]]` : null
            ].filter(Boolean).join(" · ");

            const content = `# Ingatan ${entry.num}\n\n${entry.teks}\n\n---\n\n${nav}\n`;
            fs.writeFileSync(path.join(memoryDir, `${entry.baseName}.md`), content, "utf-8");
        });

        // --- kelompok bertopik: 1 folder per topik, 1 note induk + note anak ---
        const daftarTopik: { judul: string; slug: string }[] = [];

        for (const { judul, items } of kelompokTopik.values()) {
            const topikSlug = slugify(judul) || "topik";
            const topikDir = path.join(memoryDir, topikSlug);
            if (!fs.existsSync(topikDir)) fs.mkdirSync(topikDir, { recursive: true });

            const anak = items.map((m, i) => {
                const num = String(i + 1).padStart(3, "0");
                const slug = slugify(entryText(m)) || "ingatan";
                return { num, slug, teks: entryText(m), baseName: `${num} - ${slug}` };
            });

            const namaIndukFile = `_${topikSlug}`;

            anak.forEach(child => {
                const content =
                    `# ${judul} — ${child.num}\n\n${child.teks}\n\n---\n\n` +
                    `[[LINA Memory/${topikSlug}/${namaIndukFile}|↑ ${judul}]]\n`;
                fs.writeFileSync(path.join(topikDir, `${child.baseName}.md`), content, "utf-8");
            });

            const barisAnak = anak.map(c => `- [[LINA Memory/${topikSlug}/${c.baseName}|${c.slug}]]`);
            const indukContent =
                `# ${judul}\n\n` +
                `Induk topik — kumpulan ingatan yang lahir dari obrolan soal "${judul}".\n\n` +
                (barisAnak.length > 0 ? barisAnak.join("\n") : "_Belum ada ingatan di topik ini._") +
                "\n\n---\n\n[[LINA Memory Index|↑ index]]\n";

            fs.writeFileSync(path.join(topikDir, `${namaIndukFile}.md`), indukContent, "utf-8");

            daftarTopik.push({ judul, slug: topikSlug });
        }

        // --- index utama ---
        const barisLepas = catatanLepas.map(e => `- [[LINA Memory/${e.baseName}|${e.slug}]]`);
        const barisTopik = daftarTopik.map(t => `- **[[LINA Memory/${t.slug}/_${t.slug}|${t.judul}]]**`);

        const bagianTopik = barisTopik.length > 0
            ? `## Per Topik\n\n${barisTopik.join("\n")}\n\n`
            : "";
        const bagianLepas = barisLepas.length > 0
            ? `## Lepas (dari sebelum sistem topik ada)\n\n${barisLepas.join("\n")}\n`
            : "";

        const indexContent =
            "# LINA — Ingatan Jangka Panjang\n\n" +
            "Auto-generated oleh LINA tiap ada ingatan baru/berubah — edit manual di sini " +
            "akan ketimpa. Buat ubah ingatan, ngobrol langsung sama LINA.\n\n" +
            (bagianTopik || bagianLepas ? bagianTopik + bagianLepas : "_Belum ada ingatan tersimpan._\n");

        fs.writeFileSync(path.join(vaultDir, "LINA Memory Index.md"), indexContent, "utf-8");

    } catch (error) {
        logError("Gagal sync memori ke Obsidian.", error);
    }
}
