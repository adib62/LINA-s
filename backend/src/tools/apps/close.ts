import { Tool } from "../tool";

export const CloseApp: Tool = {

    name: "app.close",

    description: "Close application.",

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