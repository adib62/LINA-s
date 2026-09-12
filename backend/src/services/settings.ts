import * as fs from "fs";
import * as path from "path";
import { DEFAULT_SPEAKER, GROQ_MODEL } from "../config/constants";

export type Effort = "low" | "medium" | "high";
export type UiMode = "voice" | "chat" | "agent";

export interface Settings {
    model: string;
    effort: Effort;
    speakerId: number;
    autoSpeak: boolean;
    webcam: boolean;
    faceRecognition: boolean;
    alertMode: boolean;
    telegramNotif: boolean;
    language: string;
    mode: UiMode;
    /** Sistem inisiatif (scheduler): boleh nyeletuk sendiri atau tidak. */
    initiativeEnabled: boolean;
}

const settingsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "settings.json"
);

const defaults: Settings = {
    model: GROQ_MODEL,
    effort: "medium",
    speakerId: DEFAULT_SPEAKER,
    autoSpeak: true,
    webcam: false,
    faceRecognition: false,
    alertMode: true,
    telegramNotif: false,
    language: "JA / ID",
    mode: "voice",
    initiativeEnabled: true
};

let cache: Settings | null = null;

function ensureDir(): void {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function getSettings(): Settings {
    if (cache) return cache;

    ensureDir();

    if (!fs.existsSync(settingsPath)) {
        cache = { ...defaults };
        fs.writeFileSync(settingsPath, JSON.stringify(cache, null, 4));
        return cache;
    }

    try {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        // Merge supaya field baru tetap punya default
        cache = { ...defaults, ...JSON.parse(raw) };
    } catch {
        cache = { ...defaults };
    }

    return cache!;
}

export function updateSettings(patch: Partial<Settings>): Settings {
    const current = getSettings();
    cache = { ...current, ...patch };

    ensureDir();
    fs.writeFileSync(settingsPath, JSON.stringify(cache, null, 4));

    return cache;
}
