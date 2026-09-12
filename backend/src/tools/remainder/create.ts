import { Tool } from "../tool";
import { createReminder } from "../../services/reminder";
import { parseWaktu, jarakWaktu } from "../../utils/datetime";

export const CreateReminder: Tool = {

    name: "reminder.create",

    description:
        "Membuat pengingat baru. Pakai kalau pengguna bilang 'ingetin aku...', " +
        "'reminder...', atau 'jangan lupa...'. " +
        "Kirim waktu APA ADANYA seperti yang diucapkan pengguna " +
        "(contoh: '5 menit lagi', 'besok jam 9', 'jumat sore') — " +
        "jangan dihitung sendiri jadi tanggal.",

    parameters: {
        teks: "string — isi pengingatnya",
        waktu: "string — kapan, dalam bahasa sehari-hari"
    },

    async execute(args) {
        const teks = String(args.teks ?? "").trim();
        const waktuTeks = String(args.waktu ?? "").trim();

        if (!teks) {
            return { success: false, message: "Isi pengingat kosong." };
        }

        const parsed = parseWaktu(waktuTeks);

        if (!parsed) {
            return {
                success: false,
                message:
                    `Waktu "${waktuTeks}" tidak bisa dipahami. ` +
                    `Coba bentuk seperti "10 menit lagi", "besok jam 9", atau "jumat jam 14:00".`
            };
        }

        const reminder = createReminder(teks, parsed.at);

        return {
            success: true,
            message: `Pengingat "${teks}" disetel ${parsed.label} (${jarakWaktu(parsed.at)}).`,
            data: reminder
        };
    }
};
