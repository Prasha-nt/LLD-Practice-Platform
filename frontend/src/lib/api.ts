let cachedWorkingBaseUrl: string | null = null;

async function getWorkingBaseUrl(): Promise<string> {
  if (cachedWorkingBaseUrl) return cachedWorkingBaseUrl;

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    let formatted = envUrl.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = `https://${formatted}`;
    }
    cachedWorkingBaseUrl = formatted.replace(/\/$/, "");
    if (!cachedWorkingBaseUrl.endsWith("/api")) {
      cachedWorkingBaseUrl = `${cachedWorkingBaseUrl}/api`;
    }
    return cachedWorkingBaseUrl;
  }

  const candidates = [
    "http://127.0.0.1:8000/api",
    "http://localhost:8000/api"
  ];

  for (const base of candidates) {
    try {
      const rootUrl = base.replace(/\/api\/?$/, "");
      const res = await fetch(`${rootUrl}/`, { method: "GET", signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        cachedWorkingBaseUrl = base;
        return base;
      }
    } catch {
      // try next candidate
    }
  }

  return "http://127.0.0.1:8000/api";
}

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  const baseUrl = await getWorkingBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  try {
    return await fetch(url, options);
  } catch (err) {
    // Reset cache and retry once
    cachedWorkingBaseUrl = null;
    const fallbackBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    const reqOptions: RequestInit | undefined = options ? {
      ...options,
      body: options.body ? String(options.body) : undefined
    } : undefined;
    return await fetch(`${fallbackBase}${endpoint}`, reqOptions);
  }
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  description: string;
  requirements: string[];
  constraints: string[];
  expected_considerations: string[];
  created_at: string;
}

export interface ProblemCreateData {
  title: string;
  difficulty: string;
  category: string;
  description: string;
  requirements: string[];
  constraints?: string[];
  expected_considerations?: string[];
}

export interface SubmissionData {
  submission_type: "STRUCTURED_TEXT" | "CODE" | "DIAGRAM" | "COMBINED";
  classes?: string;
  responsibilities?: string;
  relationships?: string;
  explanation?: string;
  code_content?: string;
  code_language?: string;
  diagram_code?: string;
}

export interface FeedbackCriterion {
  criterion_name: string;
  weight_percentage: number;
  score: number;
  max_score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  evaluator_type: string;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  criteria_feedback: FeedbackCriterion[];
  created_at: string;
}

export interface SubmissionResponse {
  id: string;
  attempt_id: string;
  submission_type: string;
  classes: string;
  responsibilities: string;
  relationships: string;
  explanation: string;
  code_content: string;
  code_language: string;
  diagram_code: string;
  created_at: string;
}

export interface AttemptDetail {
  id: string;
  problem_id: string;
  problem_title?: string;
  status: "DRAFT" | "SUBMITTED" | "EVALUATING" | "COMPLETED" | "FAILED";
  attempt_number: number;
  created_at: string;
  submitted_at?: string;
  error_message?: string;
  submission?: SubmissionResponse;
  evaluation?: Evaluation;
}

export interface AttemptHistoryItem {
  id: string;
  problem_id: string;
  problem_title: string;
  difficulty: string;
  attempt_number: number;
  status: "DRAFT" | "SUBMITTED" | "EVALUATING" | "COMPLETED" | "FAILED";
  overall_score?: number;
  submitted_at?: string;
  created_at: string;
  score_delta?: number;
}

export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetchWithFallback("/problems");
  if (!res.ok) throw new Error("Failed to fetch problems");
  return res.json();
}

export async function fetchProblemById(id: string): Promise<Problem> {
  const res = await fetchWithFallback(`/problems/${id}`);
  if (!res.ok) throw new Error("Problem not found");
  return res.json();
}

export async function createCustomProblem(problemData: ProblemCreateData): Promise<Problem> {
  const res = await fetchWithFallback("/problems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(problemData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to create problem" }));
    throw new Error(errorData.detail || "Failed to create custom problem");
  }
  return res.json();
}

export async function createAttempt(problemId: string): Promise<{ id: string; status: string; attempt_number: number }> {
  const res = await fetchWithFallback(`/problems/${problemId}/attempts`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to start attempt");
  return res.json();
}

export async function fetchAttemptDetail(attemptId: string): Promise<AttemptDetail> {
  const res = await fetchWithFallback(`/attempts/${attemptId}`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to fetch attempt details");
  return res.json();
}

export async function submitSolution(attemptId: string, submission: SubmissionData): Promise<AttemptDetail> {
  const res = await fetchWithFallback(`/attempts/${attemptId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Submission failed" }));
    throw new Error(errorData.detail || "Failed to submit solution");
  }
  return res.json();
}

export async function fetchAttemptHistory(): Promise<AttemptHistoryItem[]> {
  const res = await fetchWithFallback("/attempts/history", {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to fetch attempt history");
  return res.json();
}
