import { Tool } from "../tool";
import { createEvent } from "../../services/calendar";
import { parseWaktu, jarakWaktu } from "../../utils/datetime";

export const CreateCalendarEvent: Tool = {

    name: "calendar.create",

    description:
        "Menambahkan jadwal atau acara ke kalender. Pakai kalau pengguna bilang " +
        "'catat jadwal', 'aku ada kelas...', 'besok ada rapat...'. " +
        "Kirim waktu APA ADANYA seperti diucapkan pengguna — jangan dihitung sendiri.",

    parameters: {
        judul: "string — nama acara",
        waktu: "string — kapan mulai, bahasa sehari-hari",
        selesai: "string — opsional, kapan selesai",
        lokasi: "string — opsional",
        catatan: "string — opsional"
    },

    async execute(args) {
        const judul = String(args.judul ?? "").trim();
        const waktuTeks = String(args.waktu ?? "").trim();

        if (!judul) {
            return { success: false, message: "Judul acara kosong." };
        }

        const mulai = parseWaktu(waktuTeks);

        if (!mulai) {
            return {
                success: false,
                message:
                    `Waktu "${waktuTeks}" tidak bisa dipahami. ` +
                    `Coba seperti "besok jam 10", "senin jam 08:00", atau "tanggal 15 jam 14:00".`
            };
        }

        // Waktu selesai dihitung relatif terhadap waktu mulai,
        // supaya "sampai jam 12" tidak salah jatuh ke hari lain.
        const selesaiTeks = String(args.selesai ?? "").trim();
        const selesai = selesaiTeks
            ? parseWaktu(selesaiTeks, new Date(mulai.at))
            : null;

        const event = createEvent({
            title: judul,
            startAt: mulai.at,
            endAt: selesai ? selesai.at : null,
            location: String(args.lokasi ?? ""),
            note: String(args.catatan ?? "")
        });

        const ekor = selesai ? ` sampai ${selesai.label}` : "";

        return {
            success: true,
            message: `Jadwal "${judul}" dicatat ${mulai.label}${ekor} (${jarakWaktu(mulai.at)}).`,
            data: event
        };
    }
};
