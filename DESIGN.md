# DESIGN.md — Architecture & Domain Design Document

## 1. Product Overview & Scope

**DesignCoach** is an interactive practice platform for Low-Level Design (LLD). It enables software engineers to select real-world LLD problems, author structured architectural solutions, receive evidence-based feedback evaluated against an 8-dimension rubric, and track their design improvement over repeated attempts.

### MVP Scope (5 Core Features)
1. **Problem Selection**: Catalog of curated LLD problems (Parking Lot, Vending Machine, Elevator Control System, Tic-Tac-Toe) with functional requirements, constraints, and expected considerations.
2. **Practice Workspace**: Split-pane interface separating problem specifications from a structured submission workspace (*Classes, Responsibilities, Relationships, Design Explanation*).
3. **Submission State Engine**: Robust state transitions (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `EVALUATING` $\rightarrow$ `COMPLETED` / `FAILED`).
4. **Evidence-Based Evaluation Engine**: Evaluates solutions using the **Strategy Pattern** (`AIEvaluator`, `RuleBasedEvaluator`, `MockEvaluator`) against an 8-dimension weighted rubric.
5. **Attempt History & Growth Dashboard**: Historical progress tracking across attempt sessions with score comparisons ($\Delta$ score improvements).

---

## 2. Core Domain Model

The domain model is designed around object-oriented principles with strong encapsulation and clear state boundaries.

```
┌──────────────┐         1..*         ┌──────────────┐
│   Problem    │─────────────────────►│   Attempt    │
└──────────────┘                      └──────┬───────┘
                                             │ 1
                                             ▼ 1
                                      ┌──────────────┐
                                      │  Submission  │
                                      └──────┬───────┘
                                             │ 1
                                             ▼ 1
                                      ┌──────────────┐
                                      │  Evaluation  │
                                      └──────┬───────┘
                                             │ 1
                                             ▼ 1..*
                                      ┌──────────────┐
                                      │   Feedback   │
                                      └──────────────┘
```

### Entity Responsibilities

#### `Problem`
- **Role**: Domain entity representing an LLD challenge.
- **Attributes**: `id`, `title`, `difficulty`, `category`, `description`, `requirements`, `constraints`, `expected_considerations`.

#### `Attempt`
- **Role**: Tracks a single practice session undertaken by a learner for a given problem.
- **Attributes**: `id`, `problem_id`, `status`, `attempt_number`, `created_at`, `submitted_at`, `error_message`.
- **State Machine**:
  ```
  DRAFT  ──(User click Submit)──►  SUBMITTED  ──(Async Process)──►  EVALUATING
                                                                         │
                                                                 ┌───────┴───────┐
                                                                 ▼               ▼
                                                             COMPLETED        FAILED
  ```

#### `Submission` (Abstract Base Entity)
- **Role**: Captures the artifact produced by the learner.
- **Concrete Variant (MVP)**: `StructuredTextSubmission` (`classes`, `responsibilities`, `relationships`, `explanation`).
- **Extensibility**: Designed so `CodeSubmission` or `DiagramSubmission` can inherit from `Submission` without changing `Attempt` or `Evaluation`.

#### `Evaluation`
- **Role**: Represents the outcome of an evaluation run.
- **Attributes**: `id`, `submission_id`, `evaluator_type`, `overall_score`, `strengths`, `improvements`, `created_at`.

#### `FeedbackCriterion`
- **Role**: Individual criterion feedback item attached to an evaluation.
- **Attributes**: `criterion_name`, `weight_percentage`, `score`, `max_score`, `evidence`, `concern`, `suggestion`, `confidence`.

---

## 3. Evaluation Strategy & Rubric Design

To prevent coupling the practice flow to a single AI provider, the platform implements the **Strategy Pattern**.

```
                           ┌──────────────────────────┐
                           │    EvaluationStrategy    │
                           └────────────▲─────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             │                          │                          │
   ┌─────────┴──────────┐     ┌─────────┴──────────┐     ┌─────────┴──────────┐
   │    AIEvaluator     │     │ RuleBasedEvaluator │     │   MockEvaluator    │
   └────────────────────┘     └────────────────────┘     └────────────────────┘
```

### The 8-Dimension Evaluation Rubric

| Criterion | Weight | Focus Area |
| :--- | :---: | :--- |
| **Requirement Understanding** | 15% | Coverage of functional requirements and domain entities |
| **Responsibilities** | 20% | Single Responsibility Principle (SRP); avoidance of God classes |
| **Encapsulation** | 15% | Hiding internal states; unmodifiable getters/setters |
| **Coupling & Cohesion** | 15% | High cohesion within modules; low coupling via abstractions |
| **Abstraction** | 10% | Use of abstract base classes, interfaces, and polymorphism |
| **Extensibility** | 15% | Open-Closed Principle (OCP); leverage of design patterns |
| **Edge Cases** | 5% | Handling capacity limits, concurrency, and invalid states |
| **Explanation & Rationale** | 5% | Depth of trade-off reasoning and architectural justification |
| **Total** | **100%** | |

---

## 4. Deterministic vs. AI Responsibilities

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│     DETERMINISTIC (Rule-Engine)       │          AI / LLM REASONING          │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • Is section empty / incomplete?      │ • Are class responsibilities cohesive?│
│ • Minimum character / word counts?    │ • Is there an SRP violation smell?    │
│ • Valid attempt state transition?     │ • Is coupling too tight between types?│
│ • Idempotent duplicate submission check│ • Is design pattern appropriate?      │
│ • Database state persistence          │ • Extraction of exact evidence quotes │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 5. Failure Handling Resilience

If an external LLM call times out or fails:
1. The learner's `Submission` is already safely persisted in the database.
2. The `Attempt` state transitions to `FAILED` with a human-readable `error_message`.
3. The UI presents a friendly notification (*"Evaluation temporarily unavailable. Your solution is safely saved. Click to retry evaluation."*).
4. The `AIEvaluator` incorporates an automatic fallback to `MockEvaluator`, ensuring zero crash risk during live demonstrations.

---

## 6. Verification of Extensibility (The Two Change Tests)

### Change Test A: Adding `DiagramSubmission`
- **Scenario**: Tomorrow we want learners to upload a PlantUML or Mermaid diagram instead of structured text.
- **Impact**: We create a new schema `DiagramSubmission` inheriting from `SubmissionDB`. The `Attempt`, `Evaluation`, and `AttemptHistory` services remain **100% untouched**.

### Change Test B: Adding `HumanEvaluator` or `RuleEvaluator`
- **Scenario**: Tomorrow we introduce peer review or automated static rule checkers.
- **Impact**: We implement a new class `HumanEvaluator(EvaluationStrategy)`. The `EvaluationService` consumes `EvaluationStrategy` polymorphically. No changes are required in the practice workspace UI or attempt lifecycle.

---

## 7. Architectural Trade-offs & Engineering Decisions

1. **Monolith vs Microservices**:
   - *Decision*: Modular Monolith (FastAPI).
   - *Rationale*: For a core practice product with low domain complexity, a monolith eliminates distributed tracing overhead and network latency while keeping domain logic clean.

2. **Structured Text vs Canvas Diagram Editor**:
   - *Decision*: Structured Text Submission.
   - *Rationale*: Captures 95% of architectural reasoning with 5% of UI complexity, maximizing learner focus on LLD principles rather than canvas mechanics.

3. **PostgreSQL / SQLite vs NoSQL**:
   - *Decision*: Relational Database (SQLAlchemy).
   - *Rationale*: Attempt state transitions, submission associations, and rubric score breakdowns have strong relational integrity requirements best enforced by relational schemas.
