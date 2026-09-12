import { Tool } from "../tool";
import * as fs from "fs";
import pdfParse from "pdf-parse";
import { resolveExistingPath } from "../../config/paths";

const MAX_CHARS = 8000;

export const ReadPdf: Tool = {

    name: "office.readPdf",

    description:
        "Membaca isi teks dari file PDF yang sudah dilampirkan pengguna (materi, " +
        "modul, tugas). Pakai path file dari lampiran, lalu rangkum atau jawab " +
        "pertanyaan berdasarkan isinya.",

    parameters: {
        path: "string — path file PDF, biasanya dari lampiran pesan pengguna"
    },

    async execute(args) {
        const inputPath = String(args.path ?? "").trim();

        if (!inputPath) {
            return { success: false, message: "Path file kosong." };
        }

        let resolved: string;

        try {
            resolved = resolveExistingPath(inputPath);
        } catch (err) {
            return { success: false, message: (err as Error).message };
        }

        if (!fs.existsSync(resolved)) {
            return { success: false, message: `File tidak ditemukan: ${inputPath}` };
        }

        const buffer = fs.readFileSync(resolved);
        const data = await pdfParse(buffer);
        const teks = data.text.trim();

        return {
            success: true,
            message: `Berhasil membaca ${data.numpages} halaman PDF.`,
            data: {
                halaman: data.numpages,
                teks: teks.length > MAX_CHARS
                    ? teks.slice(0, MAX_CHARS) + "\n...(terpotong, dokumen lebih panjang)"
                    : teks
            }
        };
    }
};
