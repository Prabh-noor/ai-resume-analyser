"use client";

import Navbar from "@/src/components/Navbar";
import type { ResumeAnalysisResponse } from "@/src/types/ats-analysis";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function scoreColor(score: number): string {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
}

function scoreRingColor(score: number): string {
    if (score >= 75) return "stroke-green-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
}

function ScoreRing({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    strokeWidth="10"
                    className="stroke-slate-100"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${scoreRingColor(score)} transition-all duration-700`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor(score)}`}>{score}</span>
                <span className="text-xs text-slate-400 mt-0.5">ATS Score</span>
            </div>
        </div>
    );
}

function KeywordPills({ title, keywords, variant }: { title: string; keywords: string[]; variant: "matched" | "missing" }) {
    const pillClass =
        variant === "matched"
            ? "bg-green-50 text-green-700 border-green-100"
            : "bg-amber-50 text-amber-700 border-amber-100";

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            {keywords.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">None identified.</p>
            ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                    {keywords.map((keyword) => (
                        <span
                            key={keyword}
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${pillClass}`}
                        >
                            {keyword}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function BulletList({ title, items, icon }: { title: string; items: string[]; icon: "check" | "arrow" }) {
    const iconClass = icon === "check" ? "text-green-500" : "text-indigo-500";

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
            <ul className="mt-3 space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
                        <span className={`mt-0.5 flex-shrink-0 ${iconClass}`}>
                            {icon === "check" ? "✓" : "→"}
                        </span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SectionScores({ sections }: { sections: ResumeAnalysisResponse["analysis"]["sections"] }) {
    const items = [
        { label: "Skills match", value: sections.skillsMatch },
        { label: "Experience match", value: sections.experienceMatch },
        { label: "Education match", value: sections.educationMatch },
        { label: "Formatting", value: sections.formattingScore },
    ];

    return (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700">Section breakdown</h3>
            <div className="mt-4 space-y-3">
                {items.map(({ label, value }) => (
                    <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{label}</span>
                            <span className={`font-semibold ${scoreColor(value)}`}>{value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                                style={{ width: `${value}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [result, setResult] = useState<ResumeAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        params.then(({ id }) => setAnalysisId(id));
    }, [params]);

    useEffect(() => {
        if (!analysisId) return;

        async function loadAnalysis() {
            try {
                const response = await fetch(`/api/resume/analysis/${analysisId}`, {
                    credentials: "same-origin",
                });
                const payload = (await response.json()) as ResumeAnalysisResponse & { error?: string };

                if (!response.ok) {
                    throw new Error(payload.error ?? "Failed to load analysis.");
                }

                setResult(payload);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load analysis.");
            } finally {
                setLoading(false);
            }
        }

        loadAnalysis();
    }, [analysisId]);

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[#F8F9FB] px-4 pt-28 pb-16 font-sans">
                <div className="max-w-3xl mx-auto">
                    {loading && (
                        <div className="text-center py-20">
                            <p className="text-slate-400 text-sm">Loading your analysis…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="text-center py-20">
                            <p className="text-red-400 text-sm">{error}</p>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="mt-4 text-sm text-indigo-500 hover:text-indigo-600 underline underline-offset-2"
                            >
                                Back to dashboard
                            </button>
                        </div>
                    )}

                    {!loading && result && (
                        <>
                            <div className="mb-8">
                                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 text-xs font-semibold tracking-widest uppercase">
                                    Analysis complete
                                </span>
                                <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
                                    ATS Results
                                </h1>
                                <p className="mt-2 text-slate-400 text-sm">
                                    {result.meta.fileName} · {new Date(result.meta.analyzedAt).toLocaleString()}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex items-center justify-center">
                                    <ScoreRing score={result.analysis.atsScore} />
                                </div>

                                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                                    <h2 className="text-sm font-semibold text-slate-700">Summary</h2>
                                    <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                                        {result.analysis.summary}
                                    </p>
                                    <div className="mt-4 flex gap-4 text-xs text-slate-400">
                                        <span>{result.parsed.pageCount} page{result.parsed.pageCount !== 1 ? "s" : ""}</span>
                                        <span>{result.parsed.textLength.toLocaleString()} characters extracted</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <KeywordPills
                                    title="Matched keywords"
                                    keywords={result.analysis.matchedKeywords}
                                    variant="matched"
                                />
                                <KeywordPills
                                    title="Missing keywords"
                                    keywords={result.analysis.missingKeywords}
                                    variant="missing"
                                />
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <BulletList title="Strengths" items={result.analysis.strengths} icon="check" />
                                <BulletList title="Improvements" items={result.analysis.improvements} icon="arrow" />
                            </div>

                            <div className="mt-4">
                                <SectionScores sections={result.analysis.sections} />
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 transition-colors"
                                >
                                    Analyze another resume
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
