import { Tool } from "../tool";
import { GenerateDocx } from "./generateDocx";
import { GeneratePptx } from "./generatePptx";
import { GeneratePdf } from "./generatePdf";
import { ReadPdf } from "./readPdf";
import { ConvertFile } from "./convertFile";

const AKSI = ["docx", "pptx", "pdf", "baca_pdf", "convert"] as const;

export const DocumentManage: Tool = {

    name: "document.manage",

    description:
        "Kelola dokumen dalam satu tool: bikin Word (.docx), presentasi (.pptx), PDF " +
        "dari HTML custom, baca isi PDF yang dilampirkan, atau convert file ke format " +
        "lain. Pilih salah satu lewat parameter \"aksi\". Tool ini REAKTIF — hanya " +
        "dipanggil kalau pengguna secara eksplisit minta dibuatkan/dibaca/dikonversi.",

    parameters: {
        aksi: `string — salah satu dari: ${AKSI.join(" | ")}`,
        judul: "string — judul dokumen (aksi docx)",
        namaFile: "string — nama file tanpa path (aksi docx/pptx/pdf)",
        bagian: "array — [{heading?, paragraphs?:string[], bullets?:string[], table?:{headers,rows}}] (aksi docx)",
        slides: "array — [{title, bullets?:string[], notes?:string}] (aksi pptx)",
        html: "string — konten HTML lengkap (aksi pdf)",
        path: "string — path file sumber (aksi baca_pdf/convert)",
        formatTujuan: "string — pdf | docx | pptx (aksi convert)"
    },

    async execute(args) {
        const aksi = String(args.aksi ?? "").trim();

        switch (aksi) {
            case "docx": return GenerateDocx.execute(args);
            case "pptx": return GeneratePptx.execute(args);
            case "pdf": return GeneratePdf.execute(args);
            case "baca_pdf": return ReadPdf.execute(args);
            case "convert": return ConvertFile.execute(args);
            default:
                return {
                    success: false,
                    message: `Aksi "${aksi}" tidak dikenali. Pilihan: ${AKSI.join(", ")}.`
                };
        }
    }
};
