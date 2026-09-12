import { registry } from "../registry";
import { WebSearch } from "./search";

export function registerWebTools(): void {
    registry.register(WebSearch);
}