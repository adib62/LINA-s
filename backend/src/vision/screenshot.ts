import { VISION_URL } from "./client";

export interface ScreenshotResult {
    success: boolean;
    type: string;
    ocr: unknown;
    description: string | null;
}

/**
 * Ambil tangkapan layar desktop lewat vision-service (MSS + EasyOCR).
 * Dipakai tombol "Take a screenshot" di chat mode.
 */
export async function captureScreenshot(): Promise<ScreenshotResult> {
    const response = await fetch(`${VISION_URL}/vision/desktop`, {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error(`Vision Service Error: ${response.status}`);
    }

    return await response.json();
}

/** Simpan frame webcam terakhir jadi file di sisi vision-service. */
export async function captureWebcamFrame(): Promise<{ success: boolean; path: string }> {
    const response = await fetch(`${VISION_URL}/vision/capture`, {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error(`Vision Service Error: ${response.status}`);
    }

    return await response.json();
}
