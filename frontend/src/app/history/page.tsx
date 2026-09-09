"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAttemptHistory, AttemptHistoryItem } from "@/lib/api";
import { History, TrendingUp, Award, ArrowRight, Loader2, Calendar, RotateCcw, AlertCircle, Edit3, CheckCircle2 } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "COMPLETED" | "DRAFT">("ALL");

  useEffect(() => {
    fetchAttemptHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load attempt history");
        setLoading(false);
      });
  }, []);

  const filteredHistory = history.filter((item) => {
    if (filterTab === "COMPLETED") return item.status === "COMPLETED";
    if (filterTab === "DRAFT") return item.status === "DRAFT";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <History className="w-8 h-8 text-indigo-400" />
            <span>Attempt History &amp; Growth</span>
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Track your design improvement across practice sessions and evaluate score progression over time.
          </p>
        </div>

        <Link
          href="/problems"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all self-start md:self-auto"
        >
          <span>Practice New Problem</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-8 border-b border-slate-800/80 pb-4">
        {[
          { key: "ALL", label: `All Attempts (${history.length})` },
          { key: "COMPLETED", label: `Completed (${history.filter(h => h.status === 'COMPLETED').length})` },
          { key: "DRAFT", label: `In Progress (${history.filter(h => h.status === 'DRAFT').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === tab.key
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm">Fetching historical attempts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center text-rose-300 max-w-lg mx-auto my-10">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredHistory.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto my-10 space-y-4">
          <Award className="w-12 h-12 mx-auto text-indigo-400" />
          <h3 className="text-lg font-bold text-white">No Attempts Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select a problem from the catalog, submit your structured design, and watch your design score grow over repeated attempts!
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md"
          >
            <span>Browse Problems</span>
          </Link>
        </div>
      )}

      {/* Attempt History List */}
      {!loading && !error && filteredHistory.length > 0 && (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const isCompleted = item.status === "COMPLETED";
            const hasScore = isCompleted && item.overall_score !== undefined && item.overall_score !== null;
            const score = item.overall_score ?? 0;

            const scoreColor =
              !isCompleted ? "text-slate-500" : score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";
            const scoreBg =
              !isCompleted ? "bg-slate-950 border-slate-800" : score >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : score >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";

            const targetUrl = isCompleted
              ? `/attempts/${item.id}`
              : `/practice/${item.problem_id}?attemptId=${item.id}`;

            return (
              <Link
                key={item.id}
                href={targetUrl}
                className="block bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 transition-all hover:shadow-xl group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Score Circle */}
                    <div className={`w-14 h-14 rounded-xl ${scoreBg} border flex flex-col items-center justify-center flex-shrink-0`}>
                      <span className={`text-xl font-extrabold ${scoreColor}`}>
                        {hasScore ? score : "--"}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          Attempt #{item.attempt_number}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isCompleted ? "Completed" : "In Progress (Draft)"}
                        </span>

                        {item.score_delta !== null && item.score_delta !== undefined && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                              item.score_delta > 0
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : item.score_delta < 0
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>
                              {item.score_delta > 0 ? `+${item.score_delta}` : item.score_delta} pts improvement
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {item.problem_title}
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isCompleted
                            ? `Submitted on ${new Date(item.submitted_at || item.created_at).toLocaleString()}`
                            : `Started on ${new Date(item.created_at).toLocaleString()}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center space-x-1">
                      <span>{isCompleted ? "View Breakdown" : "Continue Practice"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
