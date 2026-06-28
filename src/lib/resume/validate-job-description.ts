import { MAX_JOB_DESCRIPTION_CHARS, MIN_JOB_DESCRIPTION_CHARS } from "./constants";

export class JobDescriptionValidationError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "JobDescriptionValidationError";
        this.status = status;
    }
}

export function validateJobDescription(jobDescription: unknown): string {
    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
        throw new JobDescriptionValidationError("Job description is required.");
    }

    const trimmed = jobDescription.trim();

    if (trimmed.length < MIN_JOB_DESCRIPTION_CHARS) {
        throw new JobDescriptionValidationError(
            `Job description must be at least ${MIN_JOB_DESCRIPTION_CHARS} characters.`,
        );
    }

    if (trimmed.length > MAX_JOB_DESCRIPTION_CHARS) {
        throw new JobDescriptionValidationError(
            `Job description must not exceed ${MAX_JOB_DESCRIPTION_CHARS} characters.`,
        );
    }

    return trimmed;
}
