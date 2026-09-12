import { registry } from "../registry";
import { SetInitiative } from "./initiative";

export function registerSystemTools(): void {
    registry.register(SetInitiative);
}
