import { JsonStore, makeId } from "./store";

export interface Reminder {
    id: string;
    text: string;
    /** Epoch ms jatuh tempo. */
    dueAt: number;
    createdAt: number;
    done: boolean;
    /** Sudah pernah dinotifikasi sistem inisiatif? */
    notified: boolean;
}

const store = new JsonStore<Reminder>("reminders.json");

export function listReminders(includeDone = false): Reminder[] {
    return store.all()
        .filter(r => includeDone || !r.done)
        .sort((a, b) => a.dueAt - b.dueAt);
}

export function createReminder(text: string, dueAt: number): Reminder {
    return store.add({
        id: makeId("rm"),
        text: text.trim(),
        dueAt,
        createdAt: Date.now(),
        done: false,
        notified: false
    });
}

export function removeReminder(id: string): boolean {
    return store.remove(id);
}

export function markDone(id: string): Reminder | undefined {
    return store.update(id, { done: true });
}

export function markNotified(id: string): Reminder | undefined {
    return store.update(id, { notified: true });
}

/** Cari reminder berdasarkan potongan teksnya — buat perintah suara. */
export function findByText(query: string): Reminder | undefined {
    const q = query.toLowerCase().trim();
    if (!q) return undefined;

    return store.all().find(r => !r.done && r.text.toLowerCase().includes(q));
}

/**
 * Reminder yang sudah jatuh tempo atau akan jatuh tempo dalam
 * `leadMs` milidetik ke depan, dan belum pernah dinotifikasi.
 */
export function dueReminders(leadMs: number, now = Date.now()): Reminder[] {
    return store.all().filter(r =>
        !r.done && !r.notified && r.dueAt <= now + leadMs
    );
}
