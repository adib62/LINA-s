import { Tool } from "../tool";
import { updateSettings } from "../../services/settings";

export const SetInitiative: Tool = {

    name: "system.initiative",

    description:
        "Menyalakan atau mematikan kebiasaan LINA menyampaikan pengingat/jadwal " +
        "sendiri tanpa diminta. Pakai kalau pengguna bilang 'jangan ganggu dulu', " +
        "'diemin dulu ya', 'stop notif', atau sebaliknya 'boleh notif lagi', " +
        "'nyalain lagi pengingatnya'.",

    parameters: {
        aktif: "boolean — true untuk menyalakan, false untuk mematikan"
    },

    async execute(args) {
        const aktif = args.aktif !== false;

        updateSettings({ initiativeEnabled: aktif });

        return {
            success: true,
            message: aktif
                ? "Oke, aku bakal ingetin lagi kalau ada jadwal atau reminder."
                : "Oke, aku diem dulu, gak bakal nyeletuk sendiri sampai kamu bilang lagi.",
            data: { initiativeEnabled: aktif }
        };
    }
};
