import { Tool } from "../tool";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { resolveExistingPath, OUTPUT_DIR, ensureOutputDir } from "../../config/paths";

const run = promisify(exec);

const VALID_FORMATS = ["pdf", "docx", "pptx"] as const;
type Format = typeof VALID_FORMATS[number];

export const ConvertFile: Tool = {

    name: "office.convertFile",

    description:
        "Mengonversi file yang sudah ada ke format lain (pdf/docx/pptx) memakai " +
        "LibreOffice headless, tanpa menyusun ulang kontennya dari nol. Pakai kalau " +
        "pengguna minta 'ubah file ini jadi pdf' pada file yang sudah dilampirkan.",

    parameters: {
        path: "string — path file sumber",
        formatTujuan: "string — pdf | docx | pptx"
    },

    async execute(args) {
        const inputArg = String(args.path ?? "").trim();
        const formatTujuan = String(args.formatTujuan ?? "").toLowerCase().trim() as Format;

        if (!VALID_FORMATS.includes(formatTujuan)) {
            return {
                success: false,
                message: `Format tujuan "${formatTujuan}" tidak didukung. Pilihan: ${VALID_FORMATS.join(", ")}.`
            };
        }

        let resolved: string;

        try {
            resolved = resolveExistingPath(inputArg);
        } catch (err) {
            return { success: false, message: (err as Error).message };
        }

        if (!fs.existsSync(resolved)) {
            return { success: false, message: `File tidak ditemukan: ${inputArg}` };
        }

        ensureOutputDir();

        try {
            await run(
                `soffice --headless --convert-to ${formatTujuan} --outdir "${OUTPUT_DIR}" "${resolved}"`,
                { timeout: 60000 }
            );
        } catch {
            return {
                success: false,
                message:
                    "Gagal menjalankan LibreOffice headless. Pastikan perintah 'soffice' " +
                    "terpasang dan bisa diakses dari PATH sistem."
            };
        }

        const baseName = path.basename(resolved, path.extname(resolved));
        const outputPath = path.join(OUTPUT_DIR, `${baseName}.${formatTujuan}`);

        if (!fs.existsSync(outputPath)) {
            return { success: false, message: "Konversi selesai tapi file hasil tidak ditemukan." };
        }

        return {
            success: true,
            message: `File berhasil dikonversi ke .${formatTujuan}.`,
            data: { path: outputPath, fileName: path.basename(outputPath) }
        };
    }
};
