import { logError } from "./logger";
import { ToolCall } from "../tools/toolCall";

export interface GroqResponse {
    indo: string;
    jepang: string;
    action: string;
    old_memory: string;
    ingatan_baru: string;
    topik?: string;
    toolCall?: ToolCall;
}

export function parseGroqResponse(
    raw: string
): GroqResponse | null {
    try {
        const data = JSON.parse(raw) as GroqResponse;

        if (!data.indo) data.indo = "";
        if (!data.jepang) data.jepang = "";
        if (!data.action) data.action = "none";
        if (!data.old_memory) data.old_memory = "";
        if (!data.ingatan_baru) data.ingatan_baru = "";
        if (!data.topik) data.topik = "";

        return data;
    } catch (error) {
        logError("Gagal nge-parse JSON dari Groq!", error);
        return null;
    }
}