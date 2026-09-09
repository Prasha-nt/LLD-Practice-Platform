from datetime import datetime, timezone
from enum import Enum
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class AttemptStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    EVALUATING = "EVALUATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class SubmissionType(str, Enum):
    STRUCTURED_TEXT = "STRUCTURED_TEXT"
    CODE = "CODE"
    DIAGRAM = "DIAGRAM"
    COMBINED = "COMBINED"

class ProblemDB(Base):
    __tablename__ = "problems"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False) # Beginner, Intermediate, Advanced
    category = Column(String, nullable=False, default="Object-Oriented Design")
    description = Column(Text, nullable=False)
    requirements = Column(JSON, nullable=False) # List[str]
    constraints = Column(JSON, nullable=False) # List[str]
    expected_considerations = Column(JSON, nullable=False) # List[str]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    attempts = relationship("AttemptDB", back_populates="problem", cascade="all, delete-orphan")

class AttemptDB(Base):
    __tablename__ = "attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)
    status = Column(String, nullable=False, default=AttemptStatus.DRAFT.value)
    attempt_number = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    problem = relationship("ProblemDB", back_populates="attempts")
    submission = relationship("SubmissionDB", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class SubmissionDB(Base):
    __tablename__ = "submissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, ForeignKey("attempts.id"), nullable=False, unique=True)
    submission_type = Column(String, nullable=False, default=SubmissionType.COMBINED.value)
    classes = Column(Text, nullable=False, default="")
    responsibilities = Column(Text, nullable=False, default="")
    relationships = Column(Text, nullable=False, default="")
    explanation = Column(Text, nullable=False, default="")
    code_content = Column(Text, nullable=False, default="")
    code_language = Column(String, nullable=False, default="python")
    diagram_code = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    attempt = relationship("AttemptDB", back_populates="submission")
    evaluation = relationship("EvaluationDB", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class EvaluationDB(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String, ForeignKey("submissions.id"), nullable=False, unique=True)
    evaluator_type = Column(String, nullable=False, default="AI") # AI, RULE_ENGINE, MOCK
    overall_score = Column(Integer, nullable=False, default=0)
    strengths = Column(JSON, nullable=False, default=list) # List[str]
    improvements = Column(JSON, nullable=False, default=list) # List[str]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    submission = relationship("SubmissionDB", back_populates="evaluation")
    criteria_feedback = relationship("FeedbackCriterionDB", back_populates="evaluation", cascade="all, delete-orphan")

class FeedbackCriterionDB(Base):
    __tablename__ = "feedback_criteria"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String, ForeignKey("evaluations.id"), nullable=False)
    criterion_name = Column(String, nullable=False)
    weight_percentage = Column(Integer, nullable=False, default=10)
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, nullable=False)
    evidence = Column(Text, nullable=False)
    concern = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=0.9)

    evaluation = relationship("EvaluationDB", back_populates="criteria_feedback")
