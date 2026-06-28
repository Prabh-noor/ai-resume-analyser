import { ACCEPTED_RESUME_MIMES, MAX_RESUME_BYTES, PDF_MIME } from "./constants";

export class ResumeValidationError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "ResumeValidationError";
        this.status = status; // error code
    }
}

export function sanitizeFilename(filename: string): string {
    const baseName = filename.replace(/^.*[\\/]/, "").trim();
    const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);

    if (!sanitized || sanitized === "." || sanitized === "..") {
        return "resume.pdf";
    }

    return sanitized;
}

export function isPdfBuffer(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 5) return false;

    const header = String.fromCharCode(...new Uint8Array(buffer.slice(0, 5)));
    return header.startsWith("%PDF-");
}

export function validateResumeFile(file: File, buffer: ArrayBuffer): void {
    if (!file.name.trim()) {
        throw new ResumeValidationError("A filename is required.");
    }

    if (file.size <= 0) {
        throw new ResumeValidationError("The uploaded file is empty.");
    }

    if (file.size > MAX_RESUME_BYTES) {
        throw new ResumeValidationError(
            `File exceeds the ${MAX_RESUME_BYTES / (1024 * 1024)} MB limit.`,
        );
    }

    if (buffer.byteLength > MAX_RESUME_BYTES) {
        throw new ResumeValidationError(
            `File exceeds the ${MAX_RESUME_BYTES / (1024 * 1024)} MB limit.`,
        );
    }

    if (!ACCEPTED_RESUME_MIMES.includes(file.type as (typeof ACCEPTED_RESUME_MIMES)[number])) {
        throw new ResumeValidationError("Only PDF, DOC, and DOCX files are accepted.");
    }

    if (file.type !== PDF_MIME) {
        throw new ResumeValidationError(
            "Word document parsing is not supported yet. Please upload a PDF resume.",
            415,
        );
    }

    if (!isPdfBuffer(buffer)) {
        throw new ResumeValidationError("The file content is not a valid PDF.");
    }
}
