import fs from "fs";
import path from "path";
import { ChatMessage } from "./history";

const conversationFilePath = path.join(
    process.cwd(),
    "src",
    "data",
    "conversation.json"
);

export function loadConversation(): ChatMessage[] {
    try {
        const dataDir = path.dirname(conversationFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        if (!fs.existsSync(conversationFilePath)) {
            fs.writeFileSync(
                conversationFilePath,
                JSON.stringify([], null, 4)
            );
        }

        return JSON.parse(
            fs.readFileSync(conversationFilePath, "utf-8")
        );
    } catch {
        return [];
    }
}

export function saveConversation(
    history: ChatMessage[]
) {
    const dataDir = path.dirname(conversationFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
        conversationFilePath,
        JSON.stringify(history, null, 4)
    );
}