from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.domain.models import AttemptDB, AttemptStatus, ProblemDB, EvaluationDB, SubmissionDB
from app.domain.schemas import AttemptHistoryItem

def create_attempt(db: Session, problem_id: str) -> AttemptDB:
    # Check if problem exists
    problem = db.query(ProblemDB).filter(ProblemDB.id == problem_id).first()
    if not problem:
        raise ValueError(f"Problem with ID '{problem_id}' not found.")

    # Calculate attempt number
    existing_count = db.query(func.count(AttemptDB.id)).filter(AttemptDB.problem_id == problem_id).scalar() or 0
    attempt_number = existing_count + 1

    attempt = AttemptDB(
        problem_id=problem_id,
        status=AttemptStatus.DRAFT.value,
        attempt_number=attempt_number,
        created_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

def get_attempt_by_id(db: Session, attempt_id: str) -> Optional[AttemptDB]:
    return db.query(AttemptDB).filter(AttemptDB.id == attempt_id).first()

def get_attempts_for_problem(db: Session, problem_id: str) -> List[AttemptDB]:
    return db.query(AttemptDB).filter(AttemptDB.problem_id == problem_id).order_by(AttemptDB.attempt_number.desc()).all()

def get_all_attempt_history(db: Session) -> List[AttemptHistoryItem]:
    attempts = db.query(AttemptDB).join(ProblemDB).order_by(AttemptDB.created_at.asc()).all()
    history_items: List[AttemptHistoryItem] = []

    # Map problem completed scores to calculate score_delta
    problem_last_completed_score: dict[str, int] = {}

    for attempt in attempts:
        score = None
        if attempt.submission and attempt.submission.evaluation:
            score = attempt.submission.evaluation.overall_score

        prev_score = problem_last_completed_score.get(attempt.problem_id)
        
        delta = None
        if score is not None:
            if prev_score is not None:
                delta = score - prev_score
            problem_last_completed_score[attempt.problem_id] = score

        history_items.append(AttemptHistoryItem(
            id=attempt.id,
            problem_id=attempt.problem_id,
            problem_title=attempt.problem.title,
            difficulty=attempt.problem.difficulty,
            attempt_number=attempt.attempt_number,
            status=AttemptStatus(attempt.status),
            overall_score=score,
            submitted_at=attempt.submitted_at,
            created_at=attempt.created_at,
            score_delta=delta
        ))

    # Return newest attempts first
    return list(reversed(history_items))
