import * as fs from "fs";
import * as path from "path";

export interface ThreadMessage {
    role: "user" | "assistant";
    content: string;
    ts: number;
}

export interface Thread {
    id: string;
    name: string;
    pinned: boolean;
    createdAt: number;
    updatedAt: number;
    messages: ThreadMessage[];
}

const threadsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "threads.json"
);

let cache: Thread[] | null = null;

function ensureDir(): void {
    const dir = path.dirname(threadsPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function persist(): void {
    ensureDir();
    fs.writeFileSync(threadsPath, JSON.stringify(cache ?? [], null, 4));
}

export function loadThreads(): Thread[] {
    if (cache) return cache;

    ensureDir();

    if (!fs.existsSync(threadsPath)) {
        cache = [];
        persist();
        return cache;
    }

    try {
        cache = JSON.parse(fs.readFileSync(threadsPath, "utf-8")) as Thread[];
    } catch {
        cache = [];
    }

    return cache!;
}

/** Pinned dulu, lalu terbaru di atas. */
export function listThreads(): Thread[] {
    return [...loadThreads()].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
    });
}

export function getThread(id: string): Thread | undefined {
    return loadThreads().find(t => t.id === id);
}

export function createThread(name: string): Thread {
    const now = Date.now();

    const thread: Thread = {
        id: `th_${now}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || "Chat baru",
        pinned: false,
        createdAt: now,
        updatedAt: now,
        messages: []
    };

    loadThreads().unshift(thread);
    persist();

    return thread;
}

export function updateThread(
    id: string,
    patch: Partial<Pick<Thread, "name" | "pinned">>
): Thread | undefined {
    const thread = getThread(id);
    if (!thread) return undefined;

    if (typeof patch.name === "string" && patch.name.trim()) {
        thread.name = patch.name.trim();
    }

    if (typeof patch.pinned === "boolean") {
        thread.pinned = patch.pinned;
    }

    thread.updatedAt = Date.now();
    persist();

    return thread;
}

export function deleteThread(id: string): boolean {
    const threads = loadThreads();
    const index = threads.findIndex(t => t.id === id);

    if (index === -1) return false;

    threads.splice(index, 1);
    persist();

    return true;
}

export function appendMessage(
    id: string,
    role: ThreadMessage["role"],
    content: string
): Thread | undefined {
    const thread = getThread(id);
    if (!thread) return undefined;

    thread.messages.push({ role, content, ts: Date.now() });
    thread.updatedAt = Date.now();
    persist();

    return thread;
}
