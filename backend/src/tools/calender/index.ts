import { registry } from "../registry";
import { CalendarManage } from "./manage";

export function registerCalendarTools(): void {
    registry.register(CalendarManage);
}
