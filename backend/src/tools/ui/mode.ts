import { Tool } from "../tool";
import { broadcast } from "../../websocket/websocket";
import { updateSettings, UiMode } from "../../services/settings";

const VALID: UiMode[] = ["voice", "chat", "agent"];

export const SwitchMode: Tool = {
    name: "ui.mode",

    description:
        "Pindah tampilan LINA antara mode suara, mode chat, dan mode agent. " +
        "Pakai ini kalau pengguna bilang 'buka chat', 'chat mode', " +
        "'balik ke voice', atau 'mode agent'.",

    parameters: {
        mode: "voice | chat | agent"
    },

    async execute(args) {
        const mode = String(args.mode ?? "").toLowerCase() as UiMode;

        if (!VALID.includes(mode)) {
            return {
                success: false,
                message: `Mode "${mode}" tidak dikenal. Pilihan: ${VALID.join(", ")}.`
            };
        }

        updateSettings({ mode });
        broadcast({ status: "MODE_SWITCH", mode });

        return {
            success: true,
            message: `Tampilan dipindah ke mode ${mode}.`,
            data: { mode }
        };
    }
};
