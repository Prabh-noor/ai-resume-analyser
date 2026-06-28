export const RESUME_BUCKET = "resumes";
export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_JOB_DESCRIPTION_CHARS = 50;
export const MAX_JOB_DESCRIPTION_CHARS = 8000;
export const PDF_MIME = "application/pdf";

export const ACCEPTED_RESUME_MIMES = [
    PDF_MIME,
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
