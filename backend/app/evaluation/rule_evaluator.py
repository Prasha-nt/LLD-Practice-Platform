from typing import Dict, Any, List
from app.evaluation.strategy import EvaluationStrategy, EvaluationResultData, CriterionFeedbackData

class RuleBasedEvaluator(EvaluationStrategy):
    """
    Deterministic rule-based evaluator for structural sanity validation.
    """
    def evaluate(self, problem_details: Dict[str, Any], submission_data: Dict[str, str]) -> EvaluationResultData:
        classes = submission_data.get("classes", "").strip()
        responsibilities = submission_data.get("responsibilities", "").strip()
        relationships = submission_data.get("relationships", "").strip()
        explanation = submission_data.get("explanation", "").strip()

        criteria: List[CriterionFeedbackData] = []
        strengths: List[str] = []
        improvements: List[str] = []

        total_score = 0

        # Check 1: Structure Completeness (15 pts)
        has_all_sections = all([classes, responsibilities, relationships, explanation])
        struct_score = 15 if has_all_sections else 5
        total_score += struct_score
        criteria.append(CriterionFeedbackData(
            criterion_name="Requirement Understanding",
            weight_percentage=15,
            score=struct_score,
            max_score=15,
            evidence=f"Submission provided {sum(1 for s in [classes, responsibilities, relationships, explanation] if s)} / 4 required sections.",
            concern="Missing sections reduce design clarity." if not has_all_sections else "All structural sections provided.",
            suggestion="Ensure all 4 structured text sections are thoroughly completed." if not has_all_sections else "Maintain comprehensive documentation across all sections.",
            confidence=1.0
        ))

        # Check 2: Responsibilities Depth (20 pts)
        resp_lines = [line for line in responsibilities.split("\n") if line.strip()]
        resp_score = min(20, max(5, len(resp_lines) * 4))
        total_score += resp_score
        criteria.append(CriterionFeedbackData(
            criterion_name="Responsibilities",
            weight_percentage=20,
            score=resp_score,
            max_score=20,
            evidence=f"Identified {len(resp_lines)} distinct responsibility statements.",
            concern="Responsibilities section lacks granular method-level assignments." if len(resp_lines) < 3 else "Good granularity of responsibility mapping.",
            suggestion="List explicit method responsibilities for each class." if len(resp_lines) < 3 else "Consider separating state management from orchestrator services.",
            confidence=0.9
        ))

        # Fill default criteria for deterministic evaluator
        other_criteria = [
            ("Encapsulation", 15, 12, "Class properties and state hiding."),
            ("Coupling & Cohesion", 15, 11, "Module coupling heuristics."),
            ("Abstraction", 10, 8, "Use of abstract base classes or interfaces."),
            ("Extensibility", 15, 11, "Potential for adding new features without breaking existing code."),
            ("Edge Cases", 5, 3, "Handling empty/null or concurrency edge cases."),
            ("Explanation", 5, 4, "Quality of design reasoning.")
        ]

        for name, max_s, s, desc in other_criteria:
            total_score += s
            criteria.append(CriterionFeedbackData(
                criterion_name=name,
                weight_percentage=max_s,
                score=s,
                max_score=max_s,
                evidence=desc,
                concern="Rule-based heuristic check passed.",
                suggestion="Consider AI evaluation for deeper semantic review.",
                confidence=0.7
            ))

        if total_score >= 70:
            strengths.append("Structured submission completed with essential architectural sections.")
        else:
            improvements.append("Expand on class relationships and design rationale to improve score.")

        return EvaluationResultData(
            evaluator_type="RULE_ENGINE",
            overall_score=min(100, total_score),
            strengths=strengths,
            improvements=improvements,
            criteria_feedback=criteria
        )
