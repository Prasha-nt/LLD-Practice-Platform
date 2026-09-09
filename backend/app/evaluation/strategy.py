from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel

class CriterionFeedbackData(BaseModel):
    criterion_name: str
    weight_percentage: int
    score: int # Score achieved out of weight_percentage (e.g. 14 out of 15)
    max_score: int # e.g. 15
    evidence: str # Exact quote or observations from learner submission
    concern: str # Identified issue or smell
    suggestion: str # Concrete actionable recommendation
    confidence: float # 0.0 to 1.0

class EvaluationResultData(BaseModel):
    evaluator_type: str
    overall_score: int # 0 to 100
    strengths: List[str]
    improvements: List[str]
    criteria_feedback: List[CriterionFeedbackData]

class EvaluationStrategy(ABC):
    """
    Abstract Base Class for LLD Solution Evaluators.
    Enables Strategy Pattern for swapping AI, Rule-Based, or Mock Evaluators seamlessly.
    """
    @abstractmethod
    def evaluate(self, problem_details: Dict[str, Any], submission_data: Dict[str, str]) -> EvaluationResultData:
        """
        Evaluates a structured LLD submission against problem requirements and rubric.
        """
        pass
