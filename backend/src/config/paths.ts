import * as fs from "fs";
import * as path from "path";

/** Semua file yang dibuat tool office mendarat di sini. */
export const OUTPUT_DIR = path.join(process.cwd(), "src", "data", "output");

export function ensureOutputDir(): void {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
}

/**
 * Ubah nama file yang diminta LLM jadi path absolut di dalam OUTPUT_DIR.
 * LLM tidak pernah menentukan path secara bebas — hanya nama file, dan
 * `path.basename()` di sini membuang segala bentuk "../" atau path absolut
 * yang coba diselipkan. Timestamp ditambahkan supaya tidak saling menimpa.
 */
export function resolveOutputPath(requestedName: string, extension: string): string {
    ensureOutputDir();

    const base = path.basename(String(requestedName || "").trim());
    const safe = base.replace(/[^\w.\- ]/g, "_") || "output";

    const withoutExt = safe.toLowerCase().endsWith(`.${extension}`)
        ? safe.slice(0, -(extension.length + 1))
        : safe;

    const fileName = `${Date.now()}_${withoutExt}.${extension}`;

    return path.join(OUTPUT_DIR, fileName);
}

/**
 * Resolusi path INPUT (dibaca, bukan ditulis) — dipakai readPdf dan
 * convertFile. Path harus tetap berada di dalam folder project (mencakup
 * OUTPUT_DIR dan folder uploads), tidak boleh menjangkau ke luar itu.
 */
export function resolveExistingPath(inputPath: string): string {
    const projectRoot = process.cwd();
    const resolved = path.resolve(projectRoot, inputPath);

    const withinProject = resolved === projectRoot || resolved.startsWith(projectRoot + path.sep);

    if (!withinProject) {
        throw new Error("Path di luar direktori project tidak diizinkan.");
    }

    return resolved;
}
