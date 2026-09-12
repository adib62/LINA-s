import { VISION_URL } from "./client";

export async function analyzeWebcam() {

    const response = await fetch(`${VISION_URL}/vision/webcam`, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`Vision Service Error: ${response.status}`);
    }

    return await response.json();
}