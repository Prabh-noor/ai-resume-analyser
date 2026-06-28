import "server-only";
import { PDFParse } from "pdf-parse";

export interface ParsedPdfResult {
    text: string;
    pageCount: number;
    textLength: number;
}

export async function parsePdfFromBuffer(buffer: ArrayBuffer): Promise<ParsedPdfResult> {
    const parser = new PDFParse({ data: buffer });

    try {
        const textResult = await parser.getText();

        return {
            text: textResult.text.trim(),
            pageCount: textResult.total,
            textLength: textResult.text.length,
        };
    } finally {
        await parser.destroy();
    }
}
