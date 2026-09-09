from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.domain import schemas
from app.services import problem_service, attempt_service
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/api")
eval_service = EvaluationService()

# --- Problem Endpoints ---
@router.get("/problems", response_model=List[schemas.ProblemResponse])
def list_problems(db: Session = Depends(get_db)):
    return problem_service.get_all_problems(db)

@router.get("/problems/{problem_id}", response_model=schemas.ProblemResponse)
def get_problem(problem_id: str, db: Session = Depends(get_db)):
    problem = problem_service.get_problem_by_id(db, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem

@router.post("/problems", response_model=schemas.ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_custom_problem(problem_in: schemas.ProblemCreate, db: Session = Depends(get_db)):
    try:
        new_problem = problem_service.create_problem(db, problem_in)
        return new_problem
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Attempt Endpoints ---
@router.post("/problems/{problem_id}/attempts", response_model=schemas.AttemptCreateResponse, status_code=status.HTTP_201_CREATED)
def start_attempt(problem_id: str, db: Session = Depends(get_db)):
    try:
        attempt = attempt_service.create_attempt(db, problem_id)
        return attempt
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/attempts/history", response_model=List[schemas.AttemptHistoryItem])
def get_all_history(db: Session = Depends(get_db)):
    return attempt_service.get_all_attempt_history(db)

@router.get("/attempts/{attempt_id}", response_model=schemas.AttemptDetailResponse)
def get_attempt_detail(attempt_id: str, db: Session = Depends(get_db)):
    attempt = attempt_service.get_attempt_by_id(db, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    response = schemas.AttemptDetailResponse.model_validate(attempt)
    if attempt.problem:
        response.problem_title = attempt.problem.title

    if attempt.submission and attempt.submission.evaluation:
        response.evaluation = schemas.EvaluationResponse.model_validate(attempt.submission.evaluation)

    return response

@router.post("/attempts/{attempt_id}/submit", response_model=schemas.AttemptDetailResponse)
def submit_solution(attempt_id: str, submission: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    try:
        updated_attempt = eval_service.process_submission(db, attempt_id, submission)
        response = schemas.AttemptDetailResponse.model_validate(updated_attempt)
        if updated_attempt.problem:
            response.problem_title = updated_attempt.problem.title

        if updated_attempt.submission and updated_attempt.submission.evaluation:
            response.evaluation = schemas.EvaluationResponse.model_validate(updated_attempt.submission.evaluation)

        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
