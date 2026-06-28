import "server-only";
import Groq from "groq-sdk";
import type { AtsAnalysis } from "@/src/types/ats-analysis";
import fs from "fs/promises";
import path from "path";

// const MODEL = "llama-3.1-8b-instant"; // qwen/qwen3-32b
const MODEL = "openai/gpt-oss-120b"; // has strict mode for json outputs
const MAX_JD_CHARS = 8000;
const MAX_RESUME_CHARS = 12000;

function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GROQ_API_KEY environment variable.");
    }
    return new Groq({ apiKey });
}

function clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeAnalysis(raw: AtsAnalysis): AtsAnalysis {
    return {
        atsScore: clampScore(raw.atsScore),
        summary: raw.summary.trim(),
        matchedKeywords: raw.matchedKeywords.map((k) => k.trim()).filter(Boolean),
        missingKeywords: raw.missingKeywords.map((k) => k.trim()).filter(Boolean),
        improvements: raw.improvements.map((k) => k.trim()).filter(Boolean),
        strengths: raw.strengths.map((k) => k.trim()).filter(Boolean),
        sections: {
            skillsMatch: clampScore(raw.sections.skillsMatch),
            experienceMatch: clampScore(raw.sections.experienceMatch),
            educationMatch: clampScore(raw.sections.educationMatch),
            formattingScore: clampScore(raw.sections.formattingScore),
        },
    };
}

export async function analyzeResumeAts(
    resumeText: string,
    jobDescription: string,
): Promise<AtsAnalysis> {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content:
                    "You are an expert ATS resume analyzer. Compare the resume against the job description. " +
                    "Identify keyword matches and gaps, score fit across skills/experience/education/formatting, " +
                    "and give concrete improvements. Return only JSON matching the schema.",
            },
            {
                role: "user",
                content: [
                    "JOB DESCRIPTION:",
                    jobDescription.slice(0, MAX_JD_CHARS),
                    "",
                    "RESUME TEXT:",
                    resumeText.slice(0, MAX_RESUME_CHARS),
                ].join("\n"),
            },
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "ats_analysis",
                strict: true,
                schema: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                        "atsScore",
                        "summary",
                        "matchedKeywords",
                        "missingKeywords",
                        "improvements",
                        "strengths",
                        "sections",
                    ],
                    properties: {
                        atsScore: { type: "number" },
                        summary: { type: "string" },
                        matchedKeywords: { type: "array", items: { type: "string" } },
                        missingKeywords: { type: "array", items: { type: "string" } },
                        improvements: { type: "array", items: { type: "string" } },
                        strengths: { type: "array", items: { type: "string" } },
                        sections: {
                            type: "object",
                            additionalProperties: false,
                            required: [
                                "skillsMatch",
                                "experienceMatch",
                                "educationMatch",
                                "formattingScore",
                            ],
                            properties: {
                                skillsMatch: { type: "number" },
                                experienceMatch: { type: "number" },
                                educationMatch: { type: "number" },
                                formattingScore: { type: "number" },
                            },
                        },
                    },
                },
            },
        },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Empty response from Groq.");
    }

    const parsed = JSON.parse(content);

    const safeJobName = jobDescription
        .replace(/\s+/g, "_")    // spaces -> underscores
        .replace(/[^\w-]/g, "")  // remove invalid filename characters
        .slice(0, 20);
    const filename = `${safeJobName}_${Date.now()}.json`;
    // Save for debugging
    const debugDir = path.join(process.cwd(), "debug");
    await fs.mkdir(debugDir, { recursive: true });
    await fs.writeFile(
        path.join(debugDir, filename),
        JSON.stringify(parsed, null, 2),
        "utf8"
    );

    return normalizeAnalysis(JSON.parse(content) as AtsAnalysis);
}
