import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

import { MemoryEntry, entryText } from "../services/memory";
import { syncMemoryToObsidian } from "../services/obsidianSync";
import { isExcluded, stripFrontmatter } from "../services/vaultIndex";

/**
 * Bulk-import catatan yang udah ditulis manual di vault Obsidian jadi ingatan
 * jangka panjang LINA (memory.json), buat kasus vault udah diisi duluan
 * sebelum sistem memory.json ada / dipakai.
 *
 * Satu note .md = satu entri ingatan. Note yang udah jadi punya LINA sendiri
 * (config prompt + folder "LINA Memory" hasil generate) di-skip pakai
 * exclusion yang sama kayak vaultIndex.ts, biar gak muter balik.
 *
 * Jalanin dari folder backend/:
 *   npx ts-node src/scripts/importVaultNotes.ts --dry-run   (preview dulu)
 *   npx ts-node src/scripts/importVaultNotes.ts             (beneran nyimpen)
 */

const MAX_CHARS = 1500;
const memoryFilePath = path.join(process.cwd(), "src", "data", "memory.json");

function walkMarkdown(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkMarkdown(abs, out);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
            out.push(abs);
        }
    }
    return out;
}

/**
 * Topik = nama folder terdekat note itu (kalau note ada di dalam subfolder),
 * atau nama filenya sendiri (kalau note ada langsung di root vault).
 */
function topicFromPath(vaultDir: string, absPath: string): string {
    const relDir = path.dirname(path.relative(vaultDir, absPath));
    if (relDir === ".") return path.basename(absPath, ".md");
    return relDir.split(path.sep).pop() ?? "";
}

function main() {
    const dryRun = process.argv.includes("--dry-run");
    const vaultDir = process.env.PROMPTS_DIR?.trim();

    if (!vaultDir || !fs.existsSync(vaultDir)) {
        console.error("❌ PROMPTS_DIR belum di-set atau foldernya gak ada. Cek backend/.env.");
        process.exit(1);
    }

    if (!fs.existsSync(memoryFilePath)) {
        console.error(`❌ memory.json belum ada di ${memoryFilePath}. Jalanin backend sekali dulu biar file-nya kebuat.`);
        process.exit(1);
    }

    const currentData: MemoryEntry[] = JSON.parse(fs.readFileSync(memoryFilePath, "utf-8"));
    const existingTexts = new Set(currentData.map(m => entryText(m).toLowerCase()));

    const files = walkMarkdown(vaultDir).filter(abs => !isExcluded(path.relative(vaultDir, abs)));

    let imported = 0, skippedEmpty = 0, skippedDup = 0;
    const seenThisRun = new Set<string>();
    const hasil: MemoryEntry[] = [];

    for (const abs of files) {
        const relPath = path.relative(vaultDir, abs);
        const raw = fs.readFileSync(abs, "utf-8");
        const teks = stripFrontmatter(raw).slice(0, MAX_CHARS).trim();

        if (!teks) { skippedEmpty++; continue; }

        const key = teks.toLowerCase();
        if (existingTexts.has(key) || seenThisRun.has(key)) { skippedDup++; continue; }
        seenThisRun.add(key);

        const topik = topicFromPath(vaultDir, abs);
        hasil.push(topik ? { text: teks, topic: topik } : teks);
        imported++;
        console.log(`  + [${relPath}]${topik ? ` (topik: ${topik})` : ""}`);
    }

    console.log(
        `\n📊 Ditemukan ${files.length} note. Baru diimpor: ${imported}, ` +
        `dilewati (duplikat): ${skippedDup}, dilewati (kosong): ${skippedEmpty}.`
    );

    if (dryRun) {
        console.log("🔎 Dry-run — memory.json belum diubah. Jalanin ulang tanpa --dry-run buat nyimpen beneran.");
        return;
    }

    if (imported === 0) {
        console.log("Nggak ada yang baru buat diimpor.");
        return;
    }

    const gabungan = [...currentData, ...hasil];
    fs.writeFileSync(memoryFilePath, JSON.stringify(gabungan, null, 4));
    syncMemoryToObsidian(gabungan);

    console.log(`✅ ${imported} ingatan baru disimpen ke memory.json.`);
    console.log("↻ Restart backend biar entri barunya ke-embed & ikut kepakai di pencarian.");
}

main();
