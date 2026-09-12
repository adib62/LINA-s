import * as fs from "fs";
import * as path from "path";
import { VISION_URL } from "./client";

interface PhotoAnalysis {
    success: boolean;
    ocr: Array<{ text: string; confidence: number }>;
    description: string | null;
}

/**
 * Kirim foto yang di-upload ke vision-service buat dideskripsikan (VLM) + dibaca
 * teksnya (OCR). Independen dari jalur webcam/screenshot — cuma numpang endpoint
 * vision-service yang sama, gak nyentuh core/frame.py sama sekali.
 */
export async function describePhoto(filePath: string): Promise<string | null> {
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);

    const form = new FormData();
    form.append("file", blob, path.basename(filePath));

    const response = await fetch(`${VISION_URL}/vision/photo`, {
        method: "POST",
        body: form
    });

    if (!response.ok) {
        throw new Error(`Vision Service Error: ${response.status}`);
    }

    const data = (await response.json()) as PhotoAnalysis;

    const ocrText = data.ocr
        .map(o => o.text)
        .filter(Boolean)
        .join(", ");

    const parts = [
        data.description ? `Deskripsi: ${data.description}` : null,
        ocrText ? `Teks terbaca (OCR): ${ocrText}` : null
    ].filter(Boolean);

    return parts.length > 0 ? parts.join("\n") : null;
}
