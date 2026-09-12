import * as fs from "fs";
import * as path from "path";
import pdfParse from "pdf-parse";

/** Dibatasi kecil karena isinya disuntik ke prompt beberapa sub-agent sekaligus (Agent Mode). */
const MAX_CHARS = 4000;

const TEXT_EXTENSIONS = new Set([
    ".txt", ".md", ".csv", ".json", ".log",
    ".js", ".ts", ".py", ".html", ".css"
]);

function potong(teks: string): string {
    const trimmed = teks.trim();
    return trimmed.length > MAX_CHARS
        ? trimmed.slice(0, MAX_CHARS) + "\n...(terpotong, dokumen lebih panjang)"
        : trimmed;
}

/**
 * Ambil isi teks dari file yang dilampirkan (PDF atau teks biasa), buat disuntik
 * ke prompt sebagai konteks tugas. Balikin null kalau tipe filenya belum didukung
 * (misal gambar/docx) — biar caller tau harus kasih catatan "belum bisa dibaca otomatis".
 */
export async function extractFileText(filePath: string): Promise<string | null> {
    if (!fs.existsSync(filePath)) return null;

    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".pdf") {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return potong(data.text);
    }

    if (TEXT_EXTENSIONS.has(ext)) {
        return potong(fs.readFileSync(filePath, "utf-8"));
    }

    return null;
}
