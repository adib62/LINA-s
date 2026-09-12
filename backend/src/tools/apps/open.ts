import { Tool } from "../tool";

export const OpenApp: Tool = {

    name: "app.open",

    description: "Open application.",

    parameters: {

        app: "string"

    },

    async execute(args) {

        return {

            success: true,

            message: "Belum diimplementasikan.",

            data: args

        };

    }

};