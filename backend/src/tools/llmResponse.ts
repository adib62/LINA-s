import { ToolCall } from "./toolCall";

export interface LLMResponse {

    indo: string;

    jepang: string;

    action: "add" | "replace" | "none";

    old_memory: string;

    ingatan_baru: string;

    toolCall?: ToolCall;

}