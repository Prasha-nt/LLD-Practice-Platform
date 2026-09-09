"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchProblems, createAttempt, createCustomProblem, Problem, ProblemCreateData } from "@/lib/api";
import { BookOpen, Search, ArrowRight, Loader2, Sparkles, AlertCircle, Plus, X, Lightbulb } from "lucide-react";

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startingProblemId, setStartingProblemId] = useState<string | null>(null);

  // Custom Problem Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Object-Oriented Design");
  const [customDifficulty, setCustomDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [customDescription, setCustomDescription] = useState("");
  const [customReqs, setCustomReqs] = useState("");
  const [customConstraints, setCustomConstraints] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProblems = () => {
    setLoading(true);
    fetchProblems()
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load problems");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleStartPractice = async (problemId: string) => {
    try {
      setStartingProblemId(problemId);
      const attempt = await createAttempt(problemId);
      router.push(`/practice/${problemId}?attemptId=${attempt.id}`);
    } catch (err: any) {
      alert("Failed to start attempt: " + err.message);
      setStartingProblemId(null);
    }
  };

  // Preset Template Helper
  const handleLoadPreset = (preset: "library" | "atm" | "movie") => {
    if (preset === "library") {
      setCustomTitle("Library Management System");
      setCustomCategory("Domain Management");
      setCustomDifficulty("Intermediate");
      setCustomDescription("Design a digital library management system that tracks books, member accounts, borrowing limits, fine calculation for overdue items, and search functionality.");
      setCustomReqs("1. Book items have unique barcodes and can have multiple physical copies.\n2. Members can borrow up to 5 books at a time for 14 days.\n3. System calculates overdue fines ($1/day) upon book return.\n4. Members can search books by Title, Author, or Subject category.");
      setCustomConstraints("Book checkout operations must be thread-safe to prevent double-lending.\nFines must be paid before issuing new books.");
    } else if (preset === "atm") {
      setCustomTitle("ATM Cash Dispenser System");
      setCustomCategory("Hardware Integration & State");
      setCustomDifficulty("Intermediate");
      setCustomDescription("Design an Automated Teller Machine (ATM) system managing card authentication, PIN verification, account balance inquiry, cash dispensing using optimal note combinations, and transaction logging.");
      setCustomReqs("1. Supports Card insertion, PIN entry, and account validation.\n2. User can select Checking or Savings account.\n3. Dispense requested cash using available bill denominations ($100, $50, $20).\n4. Handle insufficient funds, invalid PIN, or out-of-cash states gracefully.");
      setCustomConstraints("Cash dispensing must be atomic.\nRetain card after 3 consecutive invalid PIN attempts.");
    } else if (preset === "movie") {
      setCustomTitle("Movie Ticket Booking System (BookMyShow)");
      setCustomCategory("Concurrency & Reservation");
      setCustomDifficulty("Advanced");
      setCustomDescription("Design an online movie theater booking platform allowing users to browse cinema halls, view showtimes, select specific seat layouts, hold seats during payment, and generate e-tickets.");
      setCustomReqs("1. Cinema has multiple halls, screens, and seat categories (Recliner, Gold, Silver).\n2. Users select movie, showtime, and seat grid.\n3. Temporarily hold selected seats for 10 minutes during checkout.\n4. Confirm seat reservation upon payment and send digital ticket.");
      setCustomConstraints("Prevent race conditions where two users book the same seat simultaneously.\nRelease seat lock automatically if payment timer expires.");
    }
  };

  const handleCreateProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customDescription.trim() || !customReqs.trim()) {
      alert("Please fill in title, description, and requirements.");
      return;
    }

    try {
      setCreating(true);
      const reqList = customReqs.split("\n").filter((r) => r.trim());
      const constraintList = customConstraints.split("\n").filter((c) => c.trim());

      const problemData: ProblemCreateData = {
        title: customTitle.trim(),
        difficulty: customDifficulty,
        category: customCategory.trim(),
        description: customDescription.trim(),
        requirements: reqList,
        constraints: constraintList.length > 0 ? constraintList : ["Follow clean object-oriented principles."],
        expected_considerations: ["Extensibility and clear entity responsibility separation."]
      };

      const newProblem = await createCustomProblem(problemData);
      setIsModalOpen(false);
      setCreating(false);
      
      // Reset form
      setCustomTitle("");
      setCustomDescription("");
      setCustomReqs("");
      setCustomConstraints("");

      // Reload & auto-start
      handleStartPractice(newProblem.id);
    } catch (err: any) {
      alert("Error creating problem: " + err.message);
      setCreating(false);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const matchesDifficulty = selectedDifficulty === "All" || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LLD Problems Catalog</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Select an object-oriented design problem or create your own custom LLD challenge to practice architecture design.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Create Custom Problem Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Problem</span>
          </button>
        </div>
      </div>

      {/* Difficulty Tabs */}
      <div className="flex items-center space-x-2 mb-8 border-b border-slate-800/80 pb-4">
        {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDifficulty === diff
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {diff}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm">Loading problem catalog...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center text-rose-300 max-w-lg mx-auto my-10">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <p className="font-semibold">{error}</p>
          <p className="text-xs text-rose-400/80 mt-1">Please make sure the backend FastAPI server is running on port 8000.</p>
        </div>
      )}

      {/* Problems Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProblems.map((problem) => {
            const isStarting = startingProblemId === problem.id;
            return (
              <div
                key={problem.id}
                className="bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-950/20 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      {problem.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        problem.difficulty === "Beginner"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : problem.difficulty === "Intermediate"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                    {problem.title}
                  </h2>

                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {problem.description}
                  </p>

                  {/* Key requirements preview */}
                  <div className="space-y-1.5 mb-6">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Key Requirements
                    </span>
                    <ul className="space-y-1">
                      {problem.requirements.slice(0, 3).map((req, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span className="line-clamp-1">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {problem.requirements.length} Requirements &bull; {problem.constraints.length} Constraints
                  </span>

                  <button
                    onClick={() => handleStartPractice(problem.id)}
                    disabled={isStarting}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Practice</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE CUSTOM PROBLEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Plus className="w-6 h-6 text-indigo-400" />
                <span>Create Custom LLD Problem</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Author your own custom design challenge or load a preset template to practice on.
              </p>
            </div>

            {/* Presets Bar */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span>Quick Presets</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPreset("library")}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all border border-slate-700"
                >
                  + Library Management
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset("atm")}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 hover:bg-amber-600 hover:text-white transition-all border border-slate-700"
                >
                  + ATM Dispenser
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset("movie")}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all border border-slate-700"
                >
                  + Movie Booking
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProblemSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rate Limiter System"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Concurrency & Rate Limiting"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the problem context and what needs to be designed..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Functional Requirements <span className="text-slate-500 font-normal">(One requirement per line)</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={`1. Support token bucket rate limiting strategy.\n2. Allow dynamic limit configuration per client ID.\n3. Return HTTP 429 when quota exceeded.`}
                  value={customReqs}
                  onChange={(e) => setCustomReqs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Constraints <span className="text-slate-500 font-normal">(One constraint per line)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder={`Must support low latency (<5ms).\nThread safe under high concurrent requests.`}
                  value={customConstraints}
                  onChange={(e) => setCustomConstraints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create &amp; Start Practice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
