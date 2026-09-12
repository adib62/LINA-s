import { Tool } from "../tool";
import {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType
} from "docx";
import * as fs from "fs";
import * as path from "path";
import { resolveOutputPath } from "../../config/paths";

interface DocxSection {
    heading?: string;
    paragraphs?: string[];
    bullets?: string[];
    table?: { headers: string[]; rows: string[][] };
}

function buildTable(headers: string[], rows: string[][]): Table {
    const headerRow = new TableRow({
        children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })]
        }))
    });

    const bodyRows = rows.map(r => new TableRow({
        children: r.map(cell => new TableCell({
            children: [new Paragraph(cell)]
        }))
    }));

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...bodyRows]
    });
}

export const GenerateDocx: Tool = {

    name: "office.generateDocx",

    description:
        "Membuat dokumen Word (.docx) dari judul dan daftar bagian (heading, paragraf, " +
        "opsional bullet list dan tabel). Pakai untuk laporan, makalah, atau tugas kuliah " +
        "yang diminta dalam format Word.",

    parameters: {
        judul: "string",
        namaFile: "string — nama file tanpa path, contoh 'laporan-praktikum'",
        bagian: "array — [{heading?, paragraphs?:string[], bullets?:string[], table?:{headers,rows}}]"
    },

    async execute(args) {
        const judul = String(args.judul ?? "Dokumen Tanpa Judul").trim();
        const namaFile = String(args.namaFile ?? (judul || "dokumen"));
        const bagian = Array.isArray(args.bagian) ? (args.bagian as DocxSection[]) : [];

        if (bagian.length === 0) {
            return { success: false, message: "Tidak ada isi dokumen (bagian kosong)." };
        }

        const children: Array<Paragraph | Table> = [
            new Paragraph({ text: judul, heading: HeadingLevel.TITLE })
        ];

        for (const sec of bagian) {
            if (sec.heading) {
                children.push(new Paragraph({ text: sec.heading, heading: HeadingLevel.HEADING_1 }));
            }

            for (const p of sec.paragraphs ?? []) {
                children.push(new Paragraph(p));
            }

            for (const b of sec.bullets ?? []) {
                children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
            }

            if (sec.table?.headers?.length) {
                children.push(buildTable(sec.table.headers, sec.table.rows ?? []));
            }
        }

        const doc = new Document({ sections: [{ children }] });
        const outputPath = resolveOutputPath(namaFile, "docx");

        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);

        return {
            success: true,
            message: `Dokumen "${judul}" berhasil dibuat (${bagian.length} bagian).`,
            data: { path: outputPath, fileName: path.basename(outputPath) }
        };
    }
};
