import { registry } from "../registry";
import { ReminderManage } from "./manage";

export function registerReminderTools(): void {
    registry.register(ReminderManage);
}
