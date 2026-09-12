import { Tool } from "../tool";
import PptxGenJS from "pptxgenjs";
import * as path from "path";
import { resolveOutputPath } from "../../config/paths";

interface SlideContent {
    title: string;
    bullets?: string[];
    notes?: string;
}

export const GeneratePptx: Tool = {

    name: "office.generatePptx",

    description:
        "Membuat presentasi PowerPoint (.pptx) dari daftar slide. Tiap slide punya " +
        "judul dan bullet points. Pakai untuk presentasi tugas kuliah dari topik yang diminta.",

    parameters: {
        namaFile: "string",
        slides: "array — [{title, bullets?:string[], notes?:string}]"
    },

    async execute(args) {
        const namaFile = String(args.namaFile ?? "presentasi");
        const slides = Array.isArray(args.slides) ? (args.slides as SlideContent[]) : [];

        if (slides.length === 0) {
            return { success: false, message: "Tidak ada slide untuk dibuat." };
        }

        const pptx = new PptxGenJS();

        for (const s of slides) {
            const slide = pptx.addSlide();

            slide.addText(s.title || "Untitled", {
                x: 0.5, y: 0.3, w: "90%", h: 1,
                fontSize: 28, bold: true, color: "1F1F1F"
            });

            if (s.bullets?.length) {
                slide.addText(
                    s.bullets.map(b => ({ text: b, options: { bullet: true, breakLine: true } })),
                    { x: 0.5, y: 1.5, w: "90%", h: 4.5, fontSize: 16, color: "333333" }
                );
            }

            if (s.notes) {
                slide.addNotes(s.notes);
            }
        }

        const outputPath = resolveOutputPath(namaFile, "pptx");
        await pptx.writeFile({ fileName: outputPath });

        return {
            success: true,
            message: `Presentasi dengan ${slides.length} slide berhasil dibuat.`,
            data: { path: outputPath, fileName: path.basename(outputPath) }
        };
    }
};
