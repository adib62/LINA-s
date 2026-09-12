import { Tool } from "../tool";
import { removeReminder, findByText, markDone } from "../../services/reminder";

export const RemoveReminder: Tool = {

    name: "reminder.remove",

    description:
        "Menghapus atau menandai selesai sebuah pengingat. " +
        "Boleh pakai id, atau sebagian teks pengingatnya.",

    parameters: {
        id: "string — opsional, id pengingat",
        teks: "string — opsional, sebagian isi pengingat",
        tandai_selesai: "boolean — true untuk menandai selesai, bukan menghapus"
    },

    async execute(args) {
        const id = String(args.id ?? "").trim();
        const teks = String(args.teks ?? "").trim();

        const target = id
            ? { id }
            : findByText(teks);

        if (!target) {
            return {
                success: false,
                message: `Pengingat "${teks || id}" tidak ditemukan.`
            };
        }

        if (args.tandai_selesai === true) {
            const done = markDone(target.id);
            return done
                ? { success: true, message: `Pengingat ditandai selesai.`, data: done }
                : { success: false, message: "Pengingat tidak ditemukan." };
        }

        const ok = removeReminder(target.id);

        return ok
            ? { success: true, message: "Pengingat dihapus." }
            : { success: false, message: "Pengingat tidak ditemukan." };
    }
};
