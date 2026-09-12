import { registry } from "../registry";
import { SwitchMode } from "./mode";

export function registerUiTools(): void {
    registry.register(SwitchMode);
}
