export interface AtsSectionScores {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    formattingScore: number;
}

export interface AtsAnalysis {
    atsScore: number;
    summary: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    improvements: string[];
    strengths: string[];
    sections: AtsSectionScores;
}

export interface ResumeAnalysisRecord {
    id: string;
    userId: string;
    fileName: string;
    storagePath: string;
    storageFullPath: string;
    jobDescription: string;
    pageCount: number;
    textLength: number;
    atsScore: number;
    analysis: AtsAnalysis;
    createdAt: string;
}

export interface ResumeAnalysisResponse {
    id: string;
    storage: {
        id: string;
        path: string;
        fullPath: string;
    };
    parsed: {
        pageCount: number;
        textLength: number;
    };
    analysis: AtsAnalysis;
    meta: {
        fileName: string;
        analyzedAt: string;
    };
}
