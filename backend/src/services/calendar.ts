import { JsonStore, makeId } from "./store";

export interface CalendarEvent {
    id: string;
    title: string;
    startAt: number;
    endAt: number | null;
    location: string;
    note: string;
    createdAt: number;
    /** Sudah pernah dinotifikasi sistem inisiatif? */
    notified: boolean;
}

const store = new JsonStore<CalendarEvent>("calendar.json");

export type Rentang = "hari-ini" | "besok" | "minggu-ini" | "semua";

function batasRentang(rentang: Rentang, now = new Date()): [number, number] {
    const mulai = new Date(now.getTime());
    mulai.setHours(0, 0, 0, 0);

    const selesai = new Date(mulai.getTime());

    switch (rentang) {
        case "hari-ini":
            selesai.setDate(selesai.getDate() + 1);
            break;
        case "besok":
            mulai.setDate(mulai.getDate() + 1);
            selesai.setDate(selesai.getDate() + 2);
            break;
        case "minggu-ini":
            selesai.setDate(selesai.getDate() + 7);
            break;
        default:
            return [0, Number.MAX_SAFE_INTEGER];
    }

    return [mulai.getTime(), selesai.getTime()];
}

export function listEvents(rentang: Rentang = "semua"): CalendarEvent[] {
    const [dari, sampai] = batasRentang(rentang);

    return store.all()
        .filter(e => e.startAt >= dari && e.startAt < sampai)
        .sort((a, b) => a.startAt - b.startAt);
}

export function createEvent(data: {
    title: string;
    startAt: number;
    endAt?: number | null;
    location?: string;
    note?: string;
}): CalendarEvent {
    return store.add({
        id: makeId("ev"),
        title: data.title.trim(),
        startAt: data.startAt,
        endAt: data.endAt ?? null,
        location: (data.location ?? "").trim(),
        note: (data.note ?? "").trim(),
        createdAt: Date.now(),
        notified: false
    });
}

export function removeEvent(id: string): boolean {
    return store.remove(id);
}

export function markNotified(id: string): CalendarEvent | undefined {
    return store.update(id, { notified: true });
}

export function findByTitle(query: string): CalendarEvent | undefined {
    const q = query.toLowerCase().trim();
    if (!q) return undefined;

    return store.all().find(e => e.title.toLowerCase().includes(q));
}

/** Event yang mulai dalam `leadMs` ke depan dan belum dinotifikasi. */
export function upcomingEvents(leadMs: number, now = Date.now()): CalendarEvent[] {
    return store.all().filter(e =>
        !e.notified && e.startAt >= now && e.startAt <= now + leadMs
    );
}
