import { registry } from "../registry";
import { DocumentManage } from "./manage";

export function registerOfficeTools(): void {
    registry.register(DocumentManage);
}
