import "server-only";
import { supabaseAdmin } from "@/src/lib/supabase/admin";
import type { AtsAnalysis, ResumeAnalysisRecord } from "@/src/types/ats-analysis";

export interface SaveAnalysisInput {
    userId: string;
    fileName: string;
    storagePath: string;
    storageFullPath: string;
    jobDescription: string;
    resumeText: string;
    pageCount: number;
    textLength: number;
    analysis: AtsAnalysis;
}

interface ResumeAnalysisRow {
    id: string;
    user_id: string;
    file_name: string;
    storage_path: string;
    storage_full_path: string;
    job_description: string;
    resume_text: string;
    page_count: number;
    text_length: number;
    ats_score: number;
    analysis: AtsAnalysis;
    created_at: string;
}

function mapRowToRecord(row: ResumeAnalysisRow): ResumeAnalysisRecord {
    return {
        id: row.id,
        userId: row.user_id,
        fileName: row.file_name,
        storagePath: row.storage_path,
        storageFullPath: row.storage_full_path,
        jobDescription: row.job_description,
        pageCount: row.page_count,
        textLength: row.text_length,
        atsScore: row.ats_score,
        analysis: row.analysis,
        createdAt: row.created_at,
    };
}

export async function saveResumeAnalysis(input: SaveAnalysisInput): Promise<ResumeAnalysisRecord> {
    const { data, error } = await supabaseAdmin
        .from("resume_analyses")
        .insert({
            user_id: input.userId,
            file_name: input.fileName,
            storage_path: input.storagePath,
            storage_full_path: input.storageFullPath,
            job_description: input.jobDescription,
            resume_text: input.resumeText,
            page_count: input.pageCount,
            text_length: input.textLength,
            ats_score: input.analysis.atsScore,
            analysis: input.analysis,
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to save resume analysis:", error.message);
        throw new Error("Failed to save analysis.");
    }

    return mapRowToRecord(data as ResumeAnalysisRow);
}

export async function getResumeAnalysisById(
    id: string,
    userId: string,
): Promise<ResumeAnalysisRecord | null> {
    const { data, error } = await supabaseAdmin
        .from("resume_analyses")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        console.error("Failed to fetch resume analysis:", error.message);
        throw new Error("Failed to fetch analysis.");
    }

    if (!data) return null;

    return mapRowToRecord(data as ResumeAnalysisRow);
}
