import * as fs from "fs";
import * as path from "path";

/**
 * Penyimpanan JSON sederhana berbasis file.
 * Dipakai reminder dan calendar supaya tidak menduplikasi kode baca/tulis.
 */
export class JsonStore<T extends { id: string }> {

    private cache: T[] | null = null;
    private readonly filePath: string;

    constructor(fileName: string) {
        this.filePath = path.join(process.cwd(), "src", "data", fileName);
    }

    private ensureDir(): void {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private persist(): void {
        this.ensureDir();
        fs.writeFileSync(this.filePath, JSON.stringify(this.cache ?? [], null, 4));
    }

    all(): T[] {
        if (this.cache) return this.cache;

        this.ensureDir();

        if (!fs.existsSync(this.filePath)) {
            this.cache = [];
            this.persist();
            return this.cache;
        }

        try {
            const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
            this.cache = Array.isArray(parsed) ? parsed : [];
        } catch {
            this.cache = [];
        }

        return this.cache!;
    }

    find(id: string): T | undefined {
        return this.all().find(x => x.id === id);
    }

    add(item: T): T {
        this.all().push(item);
        this.persist();
        return item;
    }

    update(id: string, patch: Partial<T>): T | undefined {
        const item = this.find(id);
        if (!item) return undefined;

        Object.assign(item, patch);
        this.persist();
        return item;
    }

    remove(id: string): boolean {
        const list = this.all();
        const i = list.findIndex(x => x.id === id);

        if (i === -1) return false;

        list.splice(i, 1);
        this.persist();
        return true;
    }

    /** Dipanggil setelah mengubah objek hasil `all()` secara langsung. */
    save(): void {
        this.persist();
    }
}

export function makeId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
