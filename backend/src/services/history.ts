export type Role = "user" | "assistant" | "system";
import { MAX_HISTORY } from "../config/constants";
import { loadConversation, saveConversation } from "./conversation";
export interface ChatMessage{
    role: Role;
    content: string;
}

let historyObrolan: ChatMessage[] = loadConversation();

export function getHistory() {
    return historyObrolan;
}

export function addHistory(role: Role, content: string) {
    historyObrolan.push({ role, content });

    if(historyObrolan.length > MAX_HISTORY) {
        historyObrolan = historyObrolan.slice(-MAX_HISTORY);
    }

    saveConversation(historyObrolan);
}

export function clearHistory() {
    historyObrolan = [];
    saveConversation(historyObrolan);
}