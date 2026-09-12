import { Tool } from "../tool";
import { chromium } from "playwright";
import * as path from "path";
import { resolveOutputPath } from "../../config/paths";

export const GeneratePdf: Tool = {

    name: "office.generatePdf",

    description:
        "Membuat file PDF dari konten HTML/CSS yang sudah disusun. Pakai untuk laporan " +
        "dengan layout custom (misalnya perlu warna, tabel rapi, atau tata letak khusus) " +
        "yang tidak cocok dibuat lewat generateDocx.",

    parameters: {
        namaFile: "string",
        html: "string — konten HTML lengkap, boleh sertakan tag <style> di dalamnya"
    },

    async execute(args) {
        const namaFile = String(args.namaFile ?? "dokumen");
        const html = String(args.html ?? "").trim();

        if (!html) {
            return { success: false, message: "Konten HTML kosong." };
        }

        const outputPath = resolveOutputPath(namaFile, "pdf");

        const browser = await chromium.launch();

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "networkidle" });
            await page.pdf({
                path: outputPath,
                format: "A4",
                printBackground: true,
                margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
            });
        } finally {
            await browser.close();
        }

        return {
            success: true,
            message: "PDF berhasil dibuat.",
            data: { path: outputPath, fileName: path.basename(outputPath) }
        };
    }
};
