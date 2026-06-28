import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getResumeAnalysisById } from "@/src/lib/resume/analysis";

export const runtime = "nodejs";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const record = await getResumeAnalysisById(id, user.id);

        if (!record) {
            return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
        }

        return NextResponse.json({
            id: record.id,
            storage: {
                path: record.storagePath,
                fullPath: record.storageFullPath,
            },
            parsed: {
                pageCount: record.pageCount,
                textLength: record.textLength,
            },
            analysis: record.analysis,
            meta: {
                fileName: record.fileName,
                analyzedAt: record.createdAt,
            },
        });
    } catch (error) {
        console.error("Resume analysis fetch failed:", error);
        return NextResponse.json(
            { error: "Failed to load analysis." },
            { status: 500 },
        );
    }
}
