import { Tool } from "../tool";
import { removeEvent, findByTitle } from "../../services/calendar";

export const RemoveCalendarEvent: Tool = {

    name: "calendar.remove",

    description:
        "Menghapus jadwal dari kalender. Boleh pakai id, atau sebagian judulnya.",

    parameters: {
        id: "string — opsional, id acara",
        judul: "string — opsional, sebagian judul acara"
    },

    async execute(args) {
        const id = String(args.id ?? "").trim();
        const judul = String(args.judul ?? "").trim();

        const target = id ? { id } : findByTitle(judul);

        if (!target) {
            return {
                success: false,
                message: `Jadwal "${judul || id}" tidak ditemukan.`
            };
        }

        const ok = removeEvent(target.id);

        return ok
            ? { success: true, message: "Jadwal dihapus." }
            : { success: false, message: "Jadwal tidak ditemukan." };
    }
};
