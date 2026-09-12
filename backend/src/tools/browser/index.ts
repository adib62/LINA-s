import { registry } from "../registry";
import { BrowserManage } from "./manage";

export function registerBrowserTools(): void {
    registry.register(BrowserManage);
}