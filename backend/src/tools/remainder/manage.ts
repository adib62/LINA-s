import { Tool } from "../tool";
import { CreateReminder } from "./create";
import { ListReminder } from "./list";
import { RemoveReminder } from "./remove";

const AKSI = ["buat", "list", "hapus"] as const;

export const ReminderManage: Tool = {

    name: "reminder.manage",

    description:
        "Kelola pengingat dalam satu tool: buat pengingat baru, tampilkan daftar " +
        "pengingat, atau hapus/tandai selesai pengingat. Pilih salah satu lewat " +
        "parameter \"aksi\".",

    parameters: {
        aksi: `string — salah satu dari: ${AKSI.join(" | ")}`,
        teks: "string — isi pengingat (aksi buat, wajib; hapus, opsional)",
        waktu: "string — kapan, bahasa sehari-hari (aksi buat)",
        termasuk_selesai: "boolean — opsional, default false (aksi list)",
        id: "string — opsional, id pengingat (aksi hapus)",
        tandai_selesai: "boolean — true = tandai selesai, bukan hapus (aksi hapus)"
    },

    async execute(args) {
        const aksi = String(args.aksi ?? "").trim();

        switch (aksi) {
            case "buat": return CreateReminder.execute(args);
            case "list": return ListReminder.execute(args);
            case "hapus": return RemoveReminder.execute(args);
            default:
                return {
                    success: false,
                    message: `Aksi "${aksi}" tidak dikenali. Pilihan: ${AKSI.join(", ")}.`
                };
        }
    }
};
