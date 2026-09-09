"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAttemptDetail, createAttempt, AttemptDetail } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  ShieldAlert,
  Loader2,
  FileText,
  Code2,
  FileCode,
  Workflow,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function AttemptEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.id;
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [activeArtifactTab, setActiveArtifactTab] = useState<"rubric" | "code" | "diagram">("rubric");

  useEffect(() => {
    async function loadAttempt() {
      try {
        const data = await fetchAttemptDetail(attemptId);
        setAttempt(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load attempt feedback");
        setLoading(false);
      }
    }
    loadAttempt();
  }, [attemptId]);

  const handleTryAgain = async () => {
    if (!attempt) return;
    try {
      setRetrying(true);
      const newAttempt = await createAttempt(attempt.problem_id);
      router.push(`/practice/${attempt.problem_id}?attemptId=${newAttempt.id}`);
    } catch (err: any) {
      alert("Failed to start new attempt: " + err.message);
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm">Fetching evaluation breakdown &amp; evidence feedback...</span>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="py-20 text-center text-rose-400 max-w-lg mx-auto">
        <p className="font-bold text-lg">Error</p>
        <p className="text-sm mt-1">{error || "Attempt not found"}</p>
        <Link href="/problems" className="mt-4 inline-block text-xs text-indigo-400 underline">
          Return to Problems
        </Link>
      </div>
    );
  }

  const evaluation = attempt.evaluation || (attempt.submission as any)?.evaluation;
  const submission = attempt.submission;
  const overallScore = evaluation?.overall_score ?? 0;

  const scoreColor =
    overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-amber-400" : "text-rose-400";

  const scoreBg =
    overallScore >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : overallScore >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* Navigation Topbar */}
      <div className="flex items-center justify-between">
        <Link
          href="/problems"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            href="/history"
            className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-colors"
          >
            View Attempt History
          </Link>

          <button
            onClick={handleTryAgain}
            disabled={retrying}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {retrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Try Again (Attempt #{attempt.attempt_number + 1})</span>
          </button>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-6 z-10">
          {/* Circular Score Display */}
          <div className={`w-28 h-28 rounded-2xl ${scoreBg} border flex flex-col items-center justify-center shadow-inner`}>
            <span className={`text-4xl font-extrabold tracking-tight ${scoreColor}`}>
              {overallScore}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Out of 100
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                Attempt #{attempt.attempt_number}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Evaluator: <span className="text-slate-200">{evaluation?.evaluator_type || "AI Engine"}</span>
              </span>
              {submission?.submission_type && (
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {submission.submission_type}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {attempt.problem_title || "LLD Problem Solution"}
            </h1>

            <p className="text-xs text-slate-400 mt-1">
              Evaluated on {new Date(attempt.submitted_at || attempt.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Re-attempt CTA inside banner */}
        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={handleTryAgain}
            disabled={retrying}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refactor &amp; Try Again</span>
          </button>
        </div>
      </div>

      {/* Artifact View Switcher */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveArtifactTab("rubric")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeArtifactTab === "rubric"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Rubric Breakdown</span>
        </button>

        {submission?.code_content && (
          <button
            onClick={() => setActiveArtifactTab("code")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeArtifactTab === "code"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Submitted Code ({submission.code_language})</span>
          </button>
        )}

        {submission?.diagram_code && (
          <button
            onClick={() => setActiveArtifactTab("diagram")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeArtifactTab === "diagram"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Submitted Class Diagram</span>
          </button>
        )}
      </div>

      {/* CODE VIEW */}
      {activeArtifactTab === "code" && submission?.code_content && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Candidate Source Code ({submission.code_language})</span>
          </h3>
          <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto">
            {submission.code_content}
          </pre>
        </div>
      )}

      {/* DIAGRAM VIEW */}
      {activeArtifactTab === "diagram" && submission?.diagram_code && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Workflow className="w-4 h-4 text-amber-400" />
            <span>Candidate Class Diagram Syntax</span>
          </h3>
          <pre className="bg-slate-950 p-4 rounded-xl text-xs text-amber-300 font-mono leading-relaxed overflow-x-auto">
            {submission.diagram_code}
          </pre>
        </div>
      )}

      {/* RUBRIC VIEW */}
      {activeArtifactTab === "rubric" && (
        <>
          {/* Strengths & Improvements */}
          {evaluation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Strengths */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Architectural Strengths</span>
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((str: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Improvements */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Recommended Improvements</span>
                </h3>
                <ul className="space-y-2">
                  {evaluation.improvements.map((imp: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2">
                      <span className="text-amber-400 font-bold mt-0.5">⚠</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 8-Dimension Rubric Breakdown Grid */}
          {evaluation?.criteria_feedback && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <span>8-Dimension Rubric Breakdown</span>
                </h2>
                <span className="text-xs text-slate-400">Detailed Evidence &amp; Actionable Refactoring</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {evaluation.criteria_feedback.map((crit: any, idx: number) => {
                  const pct = Math.round((crit.score / crit.max_score) * 100);
                  const cardBorder =
                    pct >= 85 ? "border-slate-800 hover:border-emerald-500/40" : pct >= 65 ? "border-slate-800 hover:border-amber-500/40" : "border-slate-800 hover:border-rose-500/40";

                  return (
                    <div
                      key={idx}
                      className={`bg-slate-900/60 border ${cardBorder} rounded-2xl p-6 space-y-4 transition-all hover:shadow-lg`}
                    >
                      {/* Top line: Name & score */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {crit.weight_percentage}% Weight
                          </span>
                          <h3 className="text-base font-bold text-white">{crit.criterion_name}</h3>
                        </div>

                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-extrabold text-white">{crit.score}</span>
                          <span className="text-xs text-slate-400">/ {crit.max_score}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 85 ? "bg-emerald-400" : pct >= 65 ? "bg-amber-400" : "bg-rose-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Evidence Box */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                          Learner Submission Evidence
                        </span>
                        <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                          &quot;{crit.evidence}&quot;
                        </p>
                      </div>

                      {/* Concern & Suggestion */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-semibold text-amber-400">Identified Issue / Concern:</span>{" "}
                          <span className="text-slate-300">{crit.concern}</span>
                        </div>

                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-indigo-200">
                          <span className="font-bold text-indigo-300 block mb-0.5">Actionable Suggestion:</span>
                          <span>{crit.suggestion}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
