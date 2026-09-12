import { Tool } from "../tool";

export const BrowserSearch: Tool = {
    name: "browser.search",

    description: "Search on browser.",

    parameters: {
        query: "string"
    },

    async execute(args) {
        return {
            success: true,
            message: "Browser search belum diimplementasikan.",
            data: args
        };
    }
};