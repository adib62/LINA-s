import { registerBrowserTools } from "./browser";
import { registerCalendarTools } from "./calender";
import { registerClipboardTools } from "./clipboard";
import { registerFileTools } from "./file";
import { registerNotesTools } from "./notes";
import { registerOfficeTools } from "./office";
import { registerReminderTools } from "./remainder";
import { registerSystemTools } from "./system";
import { registerWebTools } from "./web";
import { registerUiTools } from "./ui";
import { registry } from "./registry";
import { Tool } from "./tool";

export function registerTools(): Tool[] {
    registerBrowserTools();
    registerCalendarTools();
    registerClipboardTools();
    registerFileTools();
    registerNotesTools();
    registerOfficeTools();
    registerReminderTools();
    registerSystemTools();
    registerWebTools();
    registerUiTools();

    return registry.getAll();
}
