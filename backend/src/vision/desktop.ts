import { VISION_URL } from "./client";
import { DesktopResponse } from "./types";

export async function analyzeDesktop(): Promise<DesktopResponse> {
    const response = await fetch(`${VISION_URL}/vision/desktop`, {
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`Vision Service Error: ${response.status}`);
    }

    return await response.json();
}