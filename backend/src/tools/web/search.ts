import { Tool } from "../tool";

export const WebSearch: Tool = {
    name: "web.search",

    description: "Search information from the internet.",

    parameters: {
        query: "string"
    },

    async execute(args) {
        const query = String(args.query ?? "");

        console.log("🌐 WEB SEARCH");
        console.log("Query:", query);

        return {
            success: true,
            message: `Hasil pencarian untuk "${query}"`,
            data: {
                query,
                results: []
            }
        };
    }
};