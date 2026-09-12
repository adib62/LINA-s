import { Tool } from "../tool";
import { listEvents, Rentang } from "../../services/calendar";
import { formatWaktu, jarakWaktu } from "../../utils/datetime";

const VALID: Rentang[] = ["hari-ini", "besok", "minggu-ini", "semua"];

export const ListCalendarEvents: Tool = {

    name: "calendar.list",

    description:
        "Menampilkan jadwal dari kalender. Pakai kalau pengguna bertanya " +
        "'hari ini ada acara apa', 'jadwalku minggu ini', dan sejenisnya.",

    parameters: {
        rentang: "string — hari-ini | besok | minggu-ini | semua"
    },

    async execute(args) {
        const raw = String(args.rentang ?? "semua").toLowerCase().replace(/\s+/g, "-");
        const rentang: Rentang = (VALID as string[]).includes(raw)
            ? (raw as Rentang)
            : "semua";

        const list = listEvents(rentang);

        if (list.length === 0) {
            return {
                success: true,
                message: `Tidak ada jadwal untuk rentang "${rentang}".`,
                data: []
            };
        }

        const ringkas = list.map(e => ({
            id: e.id,
            judul: e.title,
            mulai: formatWaktu(new Date(e.startAt)),
            selesai: e.endAt ? formatWaktu(new Date(e.endAt)) : null,
            lokasi: e.location || null,
            catatan: e.note || null,
            jarak: jarakWaktu(e.startAt)
        }));

        return {
            success: true,
            message: `Ada ${list.length} jadwal.`,
            data: ringkas
        };
    }
};
