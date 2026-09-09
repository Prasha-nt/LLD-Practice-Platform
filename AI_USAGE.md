# AI_USAGE.md — Record of AI Prompting & Architectural Decision Log

This document records the architectural decisions, prompt design strategies, accepted patterns, and rejected proposals during the development of **DesignCoach**.

---

## 1. Evaluation Model Design

### AI Proposal 1: Single 0–100 Score
- **AI Suggestion**: *"Ask the LLM to output a single overall numeric score out of 100 for the user's design."*
- **Decision**: **REJECTED**.
- **Rationale**: A single numeric score gives zero actionable insights. A candidate receiving "72/100" doesn't know *why* their design lost 28 points. LLD has distinct dimensions (Encapsulation, SRP, Extensibility, Coupling) that require individual criterion-level scoring.
- **Accepted Alternative**: 8-dimension weighted rubric with explicit evidence, concern, and suggestion fields per criterion.

---

## 2. Architecture & Strategy Pattern

### AI Proposal 2: Direct LLM Call in Controller
- **AI Suggestion**: *"Instantiate the OpenAI client directly inside the `/submit` endpoint route handler."*
- **Decision**: **REJECTED**.
- **Rationale**: Direct instantiation couples the API routing layer to a specific external LLM provider, violating the Dependency Inversion Principle. It prevents offline testing, unit testing with mocks, or swapping to rule-based evaluators.
- **Accepted Alternative**: Created an `EvaluationStrategy` abstract base interface and injected an `AIEvaluator` implementation into `EvaluationService`.

---

## 3. Submission Format

### AI Proposal 3: Unstructured Freeform Textarea vs Multi-Format Support
- **AI Suggestion**: *"Provide a single giant markdown textarea or build text, code, and diagram uploaders all in the MVP."*
- **Decision**: **REJECTED**.
- **Rationale**: A single giant textarea leads to ambiguous, unstructured submissions that are hard for the evaluator to parse. Conversely, building diagram canvases or multi-file code editors in 2 days detracts from the core feedback loop.
- **Accepted Alternative**: Structured Text Submission (*Classes, Responsibilities, Relationships, Design Explanation*), designed cleanly under a `Submission` base entity.

---

## 4. Failure Handling & Persistence

### AI Proposal 4: In-Memory Automatic Retries
- **AI Suggestion**: *"If the LLM call fails, retry immediately 3 times in memory before returning an error to the frontend."*
- **Decision**: **REJECTED**.
- **Rationale**: Blocking the user's HTTP request with synchronous network retries risks request timeouts. Furthermore, if the process crashes, unpersisted learner work is lost.
- **Accepted Alternative**: Persist `Submission` in `DRAFT` $\rightarrow$ `SUBMITTED` status *before* initiating evaluation. If AI fails, state becomes `FAILED` with an explicit error message, allowing the user to safely retry without losing work.

---

## 5. Prompt Engineering Strategy

To ensure deterministic JSON responses from the LLM without formatting errors or hallucinations, the following prompt techniques were engineered:

```json
{
  "system_prompt": "You are a precise LLD evaluation system that outputs strict JSON adhering to the 8-dimension rubric.",
  "response_format": { "type": "json_object" },
  "temperature": 0.2,
  "required_fields": [
    "overall_score",
    "strengths",
    "improvements",
    "criteria_feedback"
  ]
}
```

- **Low Temperature (0.2)**: Reduces randomness in scoring across repeated evaluations of identical solutions.
- **Evidence Extraction Constraint**: The LLM is strictly instructed to include direct quotes or explicit observations from the candidate's submission text in the `evidence` field.
