import { Tool } from "../tool";
import { CreateCalendarEvent } from "./create";
import { ListCalendarEvents } from "./list";
import { RemoveCalendarEvent } from "./remove";

const AKSI = ["buat", "list", "hapus"] as const;

export const CalendarManage: Tool = {

    name: "calendar.manage",

    description:
        "Kelola kalender dalam satu tool: catat jadwal baru, tampilkan jadwal, atau " +
        "hapus jadwal. Pilih salah satu lewat parameter \"aksi\".",

    parameters: {
        aksi: `string — salah satu dari: ${AKSI.join(" | ")}`,
        judul: "string — nama acara (aksi buat, wajib; hapus, opsional)",
        waktu: "string — kapan mulai, bahasa sehari-hari (aksi buat)",
        selesai: "string — opsional, kapan selesai (aksi buat)",
        lokasi: "string — opsional (aksi buat)",
        catatan: "string — opsional (aksi buat)",
        rentang: "string — hari-ini | besok | minggu-ini | semua (aksi list)",
        id: "string — opsional, id acara (aksi hapus)"
    },

    async execute(args) {
        const aksi = String(args.aksi ?? "").trim();

        switch (aksi) {
            case "buat": return CreateCalendarEvent.execute(args);
            case "list": return ListCalendarEvents.execute(args);
            case "hapus": return RemoveCalendarEvent.execute(args);
            default:
                return {
                    success: false,
                    message: `Aksi "${aksi}" tidak dikenali. Pilihan: ${AKSI.join(", ")}.`
                };
        }
    }
};
