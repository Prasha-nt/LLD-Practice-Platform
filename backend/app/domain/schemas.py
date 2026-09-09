from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.domain.models import AttemptStatus, SubmissionType

# --- Problem Schemas ---
class ProblemBase(BaseModel):
    id: str
    title: str
    difficulty: str
    category: str
    description: str
    requirements: List[str]
    constraints: List[str]
    expected_considerations: List[str]

class ProblemCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Problem Title")
    difficulty: str = Field("Intermediate", description="Beginner, Intermediate, or Advanced")
    category: str = Field("Object-Oriented Design", description="Category / Domain")
    description: str = Field(..., min_length=10, description="Problem Description")
    requirements: List[str] = Field(..., min_length=1, description="List of functional requirements")
    constraints: List[str] = Field(default_factory=list, description="List of constraints")
    expected_considerations: List[str] = Field(default_factory=list, description="List of considerations")

class ProblemResponse(ProblemBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Submission Schemas ---
class SubmissionCreate(BaseModel):
    submission_type: SubmissionType = Field(SubmissionType.COMBINED, description="STRUCTURED_TEXT, CODE, DIAGRAM, or COMBINED")
    classes: Optional[str] = Field("", description="List of classes and data structures")
    responsibilities: Optional[str] = Field("", description="Class responsibilities and state design")
    relationships: Optional[str] = Field("", description="Inheritance, composition, and associations")
    explanation: Optional[str] = Field("", description="Design rationale and trade-offs")
    code_content: Optional[str] = Field("", description="Source code implementation (Python, Java, C++)")
    code_language: Optional[str] = Field("python", description="Programming language for code submission")
    diagram_code: Optional[str] = Field("", description="Mermaid or PlantUML class diagram code")

class SubmissionResponse(BaseModel):
    id: str
    attempt_id: str
    submission_type: str
    classes: str
    responsibilities: str
    relationships: str
    explanation: str
    code_content: str
    code_language: str
    diagram_code: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Feedback & Evaluation Schemas ---
class FeedbackCriterionResponse(BaseModel):
    criterion_name: str
    weight_percentage: int
    score: int
    max_score: int
    evidence: str
    concern: str
    suggestion: str
    confidence: float
    model_config = ConfigDict(from_attributes=True)

class EvaluationResponse(BaseModel):
    id: str
    submission_id: str
    evaluator_type: str
    overall_score: int
    strengths: List[str]
    improvements: List[str]
    criteria_feedback: List[FeedbackCriterionResponse]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Attempt Schemas ---
class AttemptCreateResponse(BaseModel):
    id: str
    problem_id: str
    status: AttemptStatus
    attempt_number: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AttemptDetailResponse(BaseModel):
    id: str
    problem_id: str
    problem_title: Optional[str] = None
    status: AttemptStatus
    attempt_number: int
    created_at: datetime
    submitted_at: Optional[datetime] = None
    error_message: Optional[str] = None
    submission: Optional[SubmissionResponse] = None
    evaluation: Optional[EvaluationResponse] = None
    model_config = ConfigDict(from_attributes=True)

class AttemptHistoryItem(BaseModel):
    id: str
    problem_id: str
    problem_title: str
    difficulty: str
    attempt_number: int
    status: AttemptStatus
    overall_score: Optional[int] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    score_delta: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
