import {
    analyzeDesktop,
} from "../vision";

import {
    analyzeWebcam,
} from "../vision/webcam";


export async function observeDesktop() {
    return await analyzeDesktop();
}


export async function observeWebcam() {
    return await analyzeWebcam();
}


export function needVision(
    pesan: string
): boolean {

    const text = pesan.toLowerCase();

    return (
        text.includes("lihat") ||
        text.includes("layar") ||
        text.includes("screen") ||
        text.includes("screenshot") ||
        text.includes("webcam") ||
        text.includes("kamera") ||
        text.includes("camera")
    );
}