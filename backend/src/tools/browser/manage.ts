import { Tool } from "../tool";
import { OpenApp } from "../apps/open";
import { CloseApp } from "../apps/close";
import { OpenUrl } from "./openUrl";
import { BrowserSearch } from "./search";
import { BrowserYoutube } from "./youtube";

const AKSI = ["buka_app", "tutup_app", "buka_url", "cari", "youtube"] as const;

export const BrowserManage: Tool = {

    name: "browser.manage",

    description:
        "Kelola aplikasi & browser dalam satu tool: buka/tutup aplikasi, buka URL, " +
        "cari lewat browser, atau putar video YouTube pertama. Pilih salah satu lewat " +
        "parameter \"aksi\".",

    parameters: {
        aksi: `string — salah satu dari: ${AKSI.join(" | ")}`,
        app: "string — opsional, nama aplikasi (aksi buka_app/tutup_app)",
        url: "string — opsional, URL tujuan (aksi buka_url)",
        query: "string — opsional, kata kunci pencarian (aksi cari/youtube)"
    },

    async execute(args) {
        const aksi = String(args.aksi ?? "").trim();

        switch (aksi) {
            case "buka_app": return OpenApp.execute(args);
            case "tutup_app": return CloseApp.execute(args);
            case "buka_url": return OpenUrl.execute(args);
            case "cari": return BrowserSearch.execute(args);
            case "youtube": return BrowserYoutube.execute(args);
            default:
                return {
                    success: false,
                    message: `Aksi "${aksi}" tidak dikenali. Pilihan: ${AKSI.join(", ")}.`
                };
        }
    }
};
