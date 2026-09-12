export enum LinaMode {
    CHAT = "CHAT",
    COMMAND = "COMMAND",
    EXECUTING_TOOL = "EXECUTING_TOOL",
    TTS = "TTS",
    MEDIA = "MEDIA",
}

let currentMode: LinaMode = LinaMode.CHAT;

export function getMode() {
    return currentMode;
}

export function setMode(mode: LinaMode) {
    currentMode = mode;
    console.log("[MODE]", mode);
}