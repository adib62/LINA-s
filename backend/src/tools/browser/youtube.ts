import { chromium, Browser, Page } from "playwright";
import { Tool } from "../tool";

let browser: Browser | null = null;
let page: Page | null = null;

export const BrowserYoutube: Tool = {
    name: "browser.youtube",

    description: "Play the first YouTube video.",

    parameters: {
        query: "string"
    },

    async execute(args) {

    const query = encodeURIComponent(String(args.query ?? ""));

    if (!browser || !browser.isConnected()) {
        browser = await chromium.launch({
            headless: false

        });

        page = await browser.newPage();
    }

    if (!page || page.isClosed()) {
        page = await browser!.newPage();
    }

    await page.goto(
        `https://www.youtube.com/results?search_query=${query}`,
        {
            waitUntil: "domcontentloaded"
        }
    );

    await page.waitForSelector("ytd-video-renderer", {
        timeout: 10000
    });

    await page.locator("ytd-video-renderer a#thumbnail").first().click();

    await page.waitForURL(/watch/, {
        timeout: 10000
    });

    return {
        success: true,
        message: "Video pertama berhasil diputar."
    };
}

};