"use client";

import Navbar from "@/src/components/Navbar";
import { createClient } from "@/src/lib/supabase/client";
import { useState, useRef, useCallback, FC } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadStatus = "idle" | "uploading" | "done" | "error";
type BadgeColor = "indigo" | "green" | "red" | "slate";

interface FileEntry {
    file: File;
    status: UploadStatus;
    progress: number;
    error: string;
}

interface SupabaseUploadResult {
    path: string;
}

// ─── Upload function — wire to Supabase ─────────────────────────────────
async function uploadToSupabase(file: File): Promise<SupabaseUploadResult> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(`uploads/${Date.now()}_${file.name}`, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw error;
    return data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES: string[] = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXT: string[] = [".pdf", ".doc", ".docx"];
const MAX_MB = 5;

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string): string {
    return type === "application/pdf" ? "PDF" : "DOC";
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
    label: string;
    color: BadgeColor;
}

const Badge: FC<BadgeProps> = ({ label, color }) => {
    const colors: Record<BadgeColor, string> = {
        indigo: "bg-indigo-50 text-indigo-600 border border-indigo-100",
        green: "bg-green-50 text-green-600 border border-green-100",
        red: "bg-red-50 text-red-500 border border-red-100",
        slate: "bg-slate-50 text-slate-500 border border-slate-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${colors[color]}`}>
            {label}
        </span>
    );
};

// ─── FileRow ──────────────────────────────────────────────────────────────────

interface FileRowProps {
    file: File;
    status: UploadStatus;
    progress: number;
    error: string;
    onRemove: (name: string) => void;
}

const FileRow: FC<FileRowProps> = ({ file, status, progress, error, onRemove }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-500 tracking-wider">{fileIcon(file.type)}</span>
        </div>

        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>

            {status === "uploading" && (
                <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
            {status === "idle" && <Badge label="Queued" color="slate" />}
            {status === "uploading" && <Badge label="Uploading…" color="indigo" />}
            {status === "done" && <Badge label="Uploaded" color="green" />}
            {status === "error" && <Badge label="Failed" color="red" />}

            {status !== "uploading" && (
                <button
                    onClick={() => onRemove(file.name)}
                    className="p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
                    aria-label="Remove file"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeUpload() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState<boolean>(false);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [globalError, setGlobalError] = useState<string>("");

    // ── Validate ──────────────────────────────────────────────────────────────
    function validate(file: File): string | null {
        if (!ACCEPTED_TYPES.includes(file.type)) return "Only PDF, DOC, and DOCX files are accepted.";
        if (file.size > MAX_MB * 1024 * 1024) return `File exceeds ${MAX_MB} MB limit.`;
        return null;
    }

    // ── Add files ─────────────────────────────────────────────────────────────
    function addFiles(incoming: File[]): void {
        setGlobalError("");
        const next: FileEntry[] = [];
        for (const file of incoming) {
            if (files.some((f) => f.file.name === file.name)) continue;
            const err = validate(file);
            next.push({ file, status: err ? "error" : "idle", progress: 0, error: err ?? "" });
        }
        setFiles((prev) => [...prev, ...next]);
    }

    function removeFile(name: string): void {
        setFiles((prev) => prev.filter((f) => f.file.name !== name));
    }

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
    const onDragLeave = useCallback(() => setDragging(false), []);
    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            addFiles(Array.from(e.dataTransfer.files));
        },
        [files], // eslint-disable-line
    );

    // ── Upload ────────────────────────────────────────────────────────────────
    async function handleUpload(): Promise<void> {
        const toUpload = files.filter((f) => f.status === "idle");
        if (!toUpload.length) return;

        for (const item of toUpload) {
            setFiles((prev) =>
                prev.map((f) => f.file.name === item.file.name ? { ...f, status: "uploading" as UploadStatus, progress: 0 } : f)
            );

            const ticker = setInterval(() => {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.file.name === item.file.name && f.status === "uploading"
                            ? { ...f, progress: Math.min(f.progress + Math.random() * 25, 90) }
                            : f
                    )
                );
            }, 300);

            try {
                await uploadToSupabase(item.file);
                clearInterval(ticker);
                setFiles((prev) =>
                    prev.map((f) => f.file.name === item.file.name ? { ...f, status: "done" as UploadStatus, progress: 100 } : f)
                );
            } catch (err) {
                clearInterval(ticker);
                const message = err instanceof Error ? err.message : "Upload failed.";
                setFiles((prev) =>
                    prev.map((f) =>
                        f.file.name === item.file.name ? { ...f, status: "error" as UploadStatus, error: message } : f
                    )
                );
            }
        }
    }

    const idleCount = files.filter((f) => f.status === "idle").length;
    const doneCount = files.filter((f) => f.status === "done").length;
    const allDone = files.length > 0 && doneCount === files.length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center px-4 pt-28 pb-16 font-sans">

                {/* ── Header ── */}
                <div className="text-center mb-10">
                    <span className="inline-block mb-4 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-500 text-xs font-semibold tracking-widest uppercase">
                        Resume Portal
                    </span>
                    <h1 className="text-4xl font-semibold text-slate-800 tracking-tight leading-tight">
                        Upload your resume
                    </h1>
                    <p className="mt-3 text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
                        Drop your file below and we'll take care of the rest. PDF, DOC, or DOCX — up to {MAX_MB} MB.
                    </p>
                </div>

                {/* ── Card ── */}
                <div className="w-full max-w-lg">

                    {/* Drop zone */}
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200 select-none
                            ${dragging
                                ? "border-indigo-400 bg-indigo-50/60 scale-[1.01]"
                                : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                            }
                        `}
                    >
                        <div className={`mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${dragging ? "bg-indigo-100" : "bg-slate-100"}`}>
                            <svg
                                className={`w-6 h-6 transition-colors duration-200 ${dragging ? "text-indigo-500" : "text-slate-400"}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                            </svg>
                        </div>

                        <p className="text-sm font-medium text-slate-600">
                            {dragging ? "Release to add files" : "Drag files here, or click to browse"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            {ACCEPTED_EXT.join(", ")} · max {MAX_MB} MB
                        </p>

                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            accept={ACCEPTED_EXT.join(",")}
                            className="hidden"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (e.target.files) addFiles(Array.from(e.target.files));
                                e.target.value = "";
                            }}
                        />
                    </div>

                    {globalError && (
                        <p className="mt-3 text-xs text-center text-red-400">{globalError}</p>
                    )}

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                            {files.map(({ file, status, progress, error }) => (
                                <FileRow
                                    key={file.name}
                                    file={file}
                                    status={status}
                                    progress={progress}
                                    error={error}
                                    onRemove={removeFile}
                                />
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    {files.length > 0 && (
                        <div className="mt-5 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setFiles([])}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                            >
                                Clear all
                            </button>

                            {allDone ? (
                                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    All files uploaded
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpload}
                                    disabled={idleCount === 0}
                                    className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${idleCount > 0
                                            ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:shadow-indigo-300"
                                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                        }
                  `}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                                    </svg>
                                    Upload {idleCount > 1 ? `${idleCount} files` : "file"}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <p className="mt-12 text-xs text-slate-300 text-center">
                    Files are stored securely · We never share your data
                </p>
            </main>
        </>
    );
}