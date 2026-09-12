import { observeDesktop } from "../src/services/vision";

async function main() {
    try {
        const result = await observeDesktop();
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}

main();