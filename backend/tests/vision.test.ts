import { analyzeDesktop } from "../src/vision";

async function main() {
    try {
        const result = await analyzeDesktop();

        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

main();