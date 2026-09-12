import { Tool } from "../tool";
import { listReminders } from "../../services/reminder";
import { formatWaktu, jarakWaktu } from "../../utils/datetime";

export const ListReminder: Tool = {

    name: "reminder.list",

    description:
        "Menampilkan daftar pengingat. Pakai kalau pengguna bertanya " +
        "'ada reminder apa', 'pengingatku apa aja', atau sejenisnya.",

    parameters: {
        termasuk_selesai: "boolean — opsional, default false"
    },

    async execute(args) {
        const includeDone = args.termasuk_selesai === true;
        const list = listReminders(includeDone);

        if (list.length === 0) {
            return { success: true, message: "Tidak ada pengingat aktif.", data: [] };
        }

        const ringkas = list.map(r => ({
            id: r.id,
            teks: r.text,
            waktu: formatWaktu(new Date(r.dueAt)),
            jarak: jarakWaktu(r.dueAt),
            selesai: r.done
        }));

        return {
            success: true,
            message: `Ada ${list.length} pengingat.`,
            data: ringkas
        };
    }
};
