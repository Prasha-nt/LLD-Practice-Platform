"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Sparkles, Target, Zap, History } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mini-LeetCode for Low-Level Design</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Practice Real LLD. Get{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
              Explainable AI Feedback
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Stop guessing whether your object-oriented design is good. Author structured solution artifacts and get instant evidence-based feedback evaluated against an 8-dimension architectural rubric.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/problems"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-base shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02]"
            >
              <BookOpen className="w-5 h-5" />
              <span>Browse LLD Problems</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            
            <Link
              href="/history"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold text-base transition-all hover:border-slate-700"
            >
              <History className="w-5 h-5 text-indigo-400" />
              <span>View Attempt History</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "8-Dimension Rubric", val: "100%", desc: "Weighted Criteria" },
              { label: "Design Smell Detection", val: "Evidence", desc: "Quoted from solution" },
              { label: "Evaluation Speed", val: "< 3 sec", desc: "AI Strategy Engine" },
              { label: "Learning Progression", val: "Attempts", desc: "Score Growth Log" },
            ].map((m, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-400">{m.val}</div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">{m.label}</div>
                <div className="text-[11px] text-slate-500">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Workflow Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight">The Practice Learning Loop</h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            From problem requirement reading to evidence-based AI feedback and attempt retry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Choose Problem",
              desc: "Select from curated real-world challenges like Parking Lot, Vending Machine, or Elevator System.",
              icon: Target,
            },
            {
              step: "02",
              title: "Author Design",
              desc: "Submit structured text covering Classes, Responsibilities, Relationships, and Design Trade-offs.",
              icon: Zap,
            },
            {
              step: "03",
              title: "AI Evaluation",
              desc: "Get score breakdowns against 8 dimensions with exact evidence quotes, concerns, and suggestions.",
              icon: ShieldCheck,
            },
            {
              step: "04",
              title: "Retry & Improve",
              desc: "Review design smells, refactor your class decomposition, and re-attempt to track score gains.",
              icon: CheckCircle2,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="relative bg-slate-900/40 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-6 flex flex-col justify-between transition-all group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      STEP {item.step}
                    </span>
                    <Icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rubric Breakdown Preview */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Evaluated Against 8 Architectural Dimensions</h2>
            <p className="mt-2 text-slate-400 text-sm">
              We judge your design quality holistically rather than forcing compliance with a single rigid reference solution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Requirement Understanding", weight: "15%" },
              { name: "Responsibilities (SRP)", weight: "20%" },
              { name: "Encapsulation & State", weight: "15%" },
              { name: "Coupling & Cohesion", weight: "15%" },
              { name: "Abstraction & Interfaces", weight: "10%" },
              { name: "Extensibility (OCP)", weight: "15%" },
              { name: "Edge Cases & Safety", weight: "5%" },
              { name: "Trade-off Explanation", weight: "5%" },
            ].map((r, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-400">{r.name}</span>
                <span className="text-lg font-bold text-amber-400 mt-2">{r.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
