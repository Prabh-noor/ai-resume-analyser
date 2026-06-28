import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import { analyzeResumeAts } from "@/src/lib/resume/analyze-ats";
import { RESUME_BUCKET } from "@/src/lib/resume/constants";
import { parsePdfFromBuffer } from "@/src/lib/resume/parse-pdf";
import { saveResumeAnalysis } from "@/src/lib/resume/analysis";
import {
    JobDescriptionValidationError,
    validateJobDescription,
} from "@/src/lib/resume/validate-job-description";
import {
    ResumeValidationError,
    sanitizeFilename,
    validateResumeFile,
} from "@/src/lib/resume/validate-file";

export const runtime = "nodejs";

export async function GET(){
    return Response.json({ response: "Server is up and running"});
}

export async function POST(request: Request) {
    try {
        console.log("Request received", request);
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const trimmedJobDescription = validateJobDescription(formData.get("jobDescription"));

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "A resume file is required." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        validateResumeFile(file, arrayBuffer);

        const safeName = sanitizeFilename(file.name);
        const storagePath = `${user.id}/uploads/${Date.now()}_${safeName}`;

        console.log("storagePath", storagePath)
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(RESUME_BUCKET)
            .upload(storagePath, Buffer.from(arrayBuffer), {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        console.log("uploadData", uploadData);

        if (uploadError) {
            console.error("Resume upload failed:", uploadError.message);
            return NextResponse.json(
                { error: "Failed to store the resume. Please try again." },
                { status: 500 },
            );
        }

        const parsed = await parsePdfFromBuffer(arrayBuffer);
        console.log("parse pdf", parsed);
        const analysis = await analyzeResumeAts(parsed.text, trimmedJobDescription);

        const saved = await saveResumeAnalysis({
            userId: user.id,
            fileName: safeName,
            storagePath: uploadData.path,
            storageFullPath: uploadData.fullPath,
            jobDescription: trimmedJobDescription,
            resumeText: parsed.text,
            pageCount: parsed.pageCount,
            textLength: parsed.textLength,
            analysis,
        });

        return NextResponse.json({
            id: saved.id,
            storage: {
                id: uploadData.id,
                path: uploadData.path,
                fullPath: uploadData.fullPath,
            },
            parsed: {
                pageCount: parsed.pageCount,
                textLength: parsed.textLength,
            },
            analysis,
            meta: {
                fileName: safeName,
                analyzedAt: saved.createdAt,
            },
        });
    } catch (error) {
        if (error instanceof ResumeValidationError || error instanceof JobDescriptionValidationError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Failed to parse AI analysis. Please try again." },
                { status: 502 },
            );
        }

        if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
            return NextResponse.json(
                { error: "AI analysis is not configured." },
                { status: 503 },
            );
        }

        console.error("Resume upload route failed:", error);
        return NextResponse.json(
            { error: "Something went wrong while processing your resume." },
            { status: 500 },
        );
    }
}
