# DesignCoach — LLD Practice & Explainable AI Feedback Platform

> **"Build a mini LeetCode, but for Low-Level Design (LLD) problems, where the learner submits their design and gets evidence-based feedback against an 8-dimension rubric."**

DesignCoach is a modern web platform designed to help software engineers practice Low-Level Design (LLD) and Object-Oriented Design (OOD) concepts. It bridges the gap between passive reading of static GitHub solutions and real-world interviewer feedback.

---

## 🌟 Key Features

1. **Curated LLD Problem Catalog**: Practice real-world scenarios including **Parking Lot System**, **Vending Machine**, **Elevator Control System**, and **Tic-Tac-Toe Game Engine**.
2. **Structured Solution Workbench**: Author design artifacts using an explicit 4-part structure (*Classes & Entities, Responsibilities & State, Class Relationships, Design Rationale & Trade-offs*).
3. **8-Dimension Rubric Evaluation**: Solutions are evaluated against a weighted 100-point rubric:
   - *Requirement Understanding (15%)*
   - *Responsibilities / SRP (20%)*
   - *Encapsulation & State Hiding (15%)*
   - *Coupling & Cohesion (15%)*
   - *Abstraction & Polymorphism (10%)*
   - *Extensibility / OCP (15%)*
   - *Edge Cases & Concurrency (5%)*
   - *Trade-off Explanation (5%)*
4. **Evidence-Based Feedback**: Returns direct quotes from the candidate's submission text to highlight exact design smells and provide actionable refactoring guidance.
5. **Strategy Pattern Architecture**: Uses an extensible `EvaluationStrategy` supporting `AIEvaluator` (LLM-driven), `RuleBasedEvaluator` (deterministic), and `MockEvaluator` (heuristic fallback).
6. **Attempt History & Score Growth**: Tracks learner improvement over repeated attempt sessions ($\Delta$ score gains across attempts).
7. **Failure Resilience**: Submissions are saved atomically before evaluation. If external calls fail, the attempt state transitions to `FAILED` with a retry option so work is never lost.

---

## 🏗 System Architecture

```
                       ┌─────────────────────────┐
                       │  Next.js 14 Web Frontend │
                       └────────────┬────────────┘
                                    │ REST API
                       ┌────────────▼────────────┐
                       │     FastAPI Backend     │
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────▼─────────┐      ┌─────────▼─────────┐      ┌─────────▼─────────┐
│ Attempt Service  │      │Submission Service │      │Evaluation Service │
└────────┬─────────┘      └───────────────────┘      └─────────┬─────────┘
         │ State Machine                                       │ Strategy Pattern
   (DRAFT->SUBMITTED                                   ┌───────▼────────┐
    ->EVALUATING->                                     │EvaluationStrat │
    COMPLETED/FAILED)                                  └───────┬────────┘
                                                               │
                                                 ┌─────────────┴─────────────┐
                                                 │                           │
                                         ┌───────▼────────┐          ┌───────▼────────┐
                                         │  AIEvaluator   │          │ RuleEvaluator  │
                                         └────────────────┘          └────────────────┘
```

---

## 📂 Repository Structure

```
lld-practice-platform/
├── backend/
│   ├── app/
│   │   ├── api/             # REST API endpoints (/problems, /attempts, /submit)
│   │   ├── db/              # SQLAlchemy database initialization & seed data
│   │   ├── domain/          # Entities (Problem, Attempt, Submission, Evaluation) & Pydantic schemas
│   │   ├── evaluation/      # Strategy Pattern (AIEvaluator, RuleEvaluator, MockEvaluator)
│   │   ├── services/        # Business logic & attempt state machine orchestration
│   │   └── main.py          # FastAPI application entrypoint & startup hooks
│   └── tests/               # Pytest suite for domain, state machine, and evaluators
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (Catalog, Workspace, Evaluation, History)
│   │   ├── components/      # UI components (Navbar, Rubric Cards, Progress Gauges)
│   │   └── lib/             # API client & TypeScript domain types
├── RESEARCH.md              # 1-2 page research on LLD education & evaluation gaps
├── DESIGN.md                # 2-4 page design document detailing domain models & change tests
├── AI_USAGE.md              # Log of AI prompt engineering decisions & rejected proposals
└── README.md                # System setup & architecture guide
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ & npm

### 1. Run Backend FastAPI Server
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
python -m uvicorn app.main:app --port 8000 --reload
```

*The database (`lld_platform.db`) will auto-initialize and seed 4 core LLD problems on startup.*

### 2. Run Web Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js dev server (runs on http://localhost:3000)
npx next dev -p 3000
```

Open `http://localhost:3000` in your web browser.

---

## 🧪 Running Unit Tests

Run the backend test suite using `pytest`:

```bash
python -m pytest backend/tests
```

### Verified Test Scenarios
- `test_create_attempt_initial_state`: Verifies initial attempt state (`DRAFT`) and numbering.
- `test_attempt_number_increments`: Verifies attempt counter increments per problem.
- `test_submission_state_transition`: Verifies state machine lifecycle (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `EVALUATING` $\rightarrow$ `COMPLETED`).
- `test_mock_evaluator_rubric_dimensions`: Verifies all 8 rubric criteria are evaluated with evidence extraction.
- `test_rule_evaluator_deterministic_behavior`: Verifies rule-based deterministic checks.
- `test_ai_evaluator_fallback_without_key`: Verifies graceful fallback to `MockEvaluator` when API keys are unconfigured.

---

## 📚 Documentation Index

- [RESEARCH.md](file:///d:/delligent/LLD/RESEARCH.md): Analysis of existing LLD learning platforms, evaluation gaps, and the evidence-based feedback model.
- [DESIGN.md](file:///d:/delligent/LLD/DESIGN.md): In-depth domain design, state machine specification, evaluation strategy pattern, and change tests.
- [AI_USAGE.md](file:///d:/delligent/LLD/AI_USAGE.md): Prompt engineering log, accepted architectural patterns, and rejected proposals.
