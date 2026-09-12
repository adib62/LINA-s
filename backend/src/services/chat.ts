import { askGroq, AskOptions } from "./groq";
import { ChatMessage } from "./history";
import { dispatchTool } from "../tools/dispatcher";
import { parseGroqResponse } from "../utils/json";
import { ToolCall } from "../tools/toolCall";
import { ToolResult } from "../tools/tool";

export interface ChatOutcome {
    /** Raw JSON string dari LLM (jawaban final). */
    raw: string;
    toolCall?: ToolCall;
    toolResult?: ToolResult;
}

/**
 * Alur: minta jawaban ke LLM. Kalau LLM minta tool, jalankan tool-nya,
 * lalu minta LLM menyusun jawaban final berdasarkan hasil tool.
 */
export async function chatWithTools(
    messages: ChatMessage[],
    signal: AbortSignal,
    options: AskOptions = {}
): Promise<ChatOutcome> {

    const firstResponse = await askGroq(messages, signal, options);
    const parsed = parseGroqResponse(firstResponse);

    if (!parsed || !parsed.toolCall) {
        return { raw: firstResponse };
    }

    console.log("========== TOOL CALL ==========");
    console.dir(parsed.toolCall, { depth: null });
    console.log("===============================");

    const toolResult = await dispatchTool(parsed.toolCall);

    console.log("========== TOOL RESULT ==========");
    console.dir(toolResult, { depth: null });
    console.log("=================================");

    const secondMessages: ChatMessage[] = [
        ...messages,
        { role: "assistant", content: firstResponse },
        {
            role: "system",
            content: "HASIL TOOL:\n" + JSON.stringify(toolResult, null, 2)
        }
    ];

    const finalResponse = await askGroq(secondMessages, signal, options);

    return {
        raw: finalResponse,
        toolCall: parsed.toolCall,
        toolResult
    };
}

/** Dipertahankan supaya kode lama yang import `chat` tetap jalan. */
export async function chat(
    messages: ChatMessage[],
    signal: AbortSignal,
    options: AskOptions = {}
): Promise<string> {
    const outcome = await chatWithTools(messages, signal, options);
    return outcome.raw;
}
