import os
import json
import logging
from typing import Dict, Any
from app.evaluation.strategy import EvaluationStrategy, EvaluationResultData, CriterionFeedbackData
from app.evaluation.mock_evaluator import MockEvaluator

logger = logging.getLogger("ai_evaluator")

RUBRIC_PROMPT_TEMPLATE = """
You are an expert Low-Level Design (LLD) interviewer and principal software architect.
Evaluate the following learner LLD submission (which may contain structured text, source code, visual Mermaid/PlantUML diagrams, or a combination) against the problem statement and requirements.

### Problem Title: {problem_title}
### Requirements:
{requirements_text}

### Learner Submission Artifacts (Format: {submission_type}):

1. Classes & Entities:
{classes}

2. Responsibilities & State Design:
{responsibilities}

3. Relationships & Associations:
{relationships}

4. Design Explanation & Trade-offs:
{explanation}

5. Source Code Implementation ({code_language}):
{code_content}

6. Class Diagram Code (Mermaid/PlantUML):
{diagram_code}

---
### EVALUATION RUBRIC (Total 100 points):
1. Requirement Understanding (Weight: 15%): Did the learner cover all core functional requirements?
2. Responsibilities (Weight: 20%): Are responsibilities well-separated? Any SRP violations (e.g. God classes)?
3. Encapsulation (Weight: 15%): Are internal states hidden? Are getters/setters or immutable views used?
4. Coupling & Cohesion (Weight: 15%): High cohesion within classes and low coupling between modules?
5. Abstraction (Weight: 10%): Proper use of interfaces, abstract base classes, and polymorphism?
6. Extensibility (Weight: 15%): Is the design open for extension (e.g. new types/strategies) but closed for modification?
7. Edge Cases (Weight: 5%): Consideration of boundary conditions, concurrency, null states, or out of capacity?
8. Explanation (Weight: 5%): Quality and depth of design rationale, code quality, and trade-off justification.

### MANDATORY OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema. Do not include markdown code block backticks (` ```json `):
{
  "overall_score": 85,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "criteria_feedback": [
    {
      "criterion_name": "Requirement Understanding",
      "weight_percentage": 15,
      "score": 14,
      "max_score": 15,
      "evidence": "Learner included Car, Bike, Truck and ParkingSpot hierarchy in code/diagram.",
      "concern": "Did not detail ticket timestamp generation upon entry.",
      "suggestion": "Include timestamp generation in ParkingTicket constructor.",
      "confidence": 0.95
    },
    ... (must include all 8 criteria above)
  ]
}
"""

class AIEvaluator(EvaluationStrategy):
    """
    LLM-powered evaluator supporting text, code, diagram, and combined submissions.
    Falls back gracefully to MockEvaluator if API key is unconfigured or call fails.
    """
    def __init__(self):
        self.fallback_evaluator = MockEvaluator()
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")

    def evaluate(self, problem_details: Dict[str, Any], submission_data: Dict[str, str]) -> EvaluationResultData:
        if not self.api_key:
            logger.info("No AI API key found in environment. Using intelligent MockEvaluator fallback.")
            return self.fallback_evaluator.evaluate(problem_details, submission_data)

        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)

            reqs_formatted = "\n".join(f"- {r}" for r in problem_details.get("requirements", []))

            prompt = RUBRIC_PROMPT_TEMPLATE.format(
                problem_title=problem_details.get("title", "LLD Problem"),
                requirements_text=reqs_formatted,
                submission_type=submission_data.get("submission_type", "COMBINED"),
                classes=submission_data.get("classes", "N/A"),
                responsibilities=submission_data.get("responsibilities", "N/A"),
                relationships=submission_data.get("relationships", "N/A"),
                explanation=submission_data.get("explanation", "N/A"),
                code_language=submission_data.get("code_language", "python"),
                code_content=submission_data.get("code_content", "N/A"),
                diagram_code=submission_data.get("diagram_code", "N/A")
            )

            response = client.chat.completions.create(
                model=os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
                messages=[
                    {"role": "system", "content": "You are a precise LLD evaluation system that outputs strict JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )

            raw_json = response.choices[0].message.content.strip()
            data = json.loads(raw_json)

            criteria_objs = []
            for item in data.get("criteria_feedback", []):
                criteria_objs.append(CriterionFeedbackData(
                    criterion_name=item["criterion_name"],
                    weight_percentage=item.get("weight_percentage", 10),
                    score=item["score"],
                    max_score=item["max_score"],
                    evidence=item["evidence"],
                    concern=item["concern"],
                    suggestion=item["suggestion"],
                    confidence=item.get("confidence", 0.9)
                ))

            overall_score = data.get("overall_score", sum(c.score for c in criteria_objs))

            return EvaluationResultData(
                evaluator_type="AI_EVALUATOR",
                overall_score=overall_score,
                strengths=data.get("strengths", []),
                improvements=data.get("improvements", []),
                criteria_feedback=criteria_objs
            )

        except Exception as e:
            logger.error(f"AI evaluation failed: {e}. Executing fallback strategy.")
            result = self.fallback_evaluator.evaluate(problem_details, submission_data)
            result.evaluator_type = "AI_FALLBACK_MOCK"
            return result
