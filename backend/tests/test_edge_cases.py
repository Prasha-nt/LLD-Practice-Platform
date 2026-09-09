import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.domain.models import Base, AttemptStatus
from app.services import attempt_service, evaluation_service, problem_service
from app.db.seed_data import seed_problems
from app.domain.schemas import SubmissionCreate

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    seed_problems(session)
    yield session
    session.close()

def test_fetch_non_existent_problem(db_session):
    problem = problem_service.get_problem_by_id(db_session, "non-existent-id")
    assert problem is None

def test_fetch_non_existent_attempt(db_session):
    attempt = attempt_service.get_attempt_by_id(db_session, "invalid-uuid")
    assert attempt is None

def test_submit_to_non_existent_attempt(db_session):
    eval_svc = evaluation_service.EvaluationService()
    sub_in = SubmissionCreate(
        classes="TestClass",
        responsibilities="TestResp",
        relationships="TestRel",
        explanation="TestExp"
    )
    with pytest.raises(ValueError, match=r"Attempt 'invalid-uuid' not found\."):
        eval_svc.process_submission(db_session, "invalid-uuid", sub_in)

def test_submit_empty_solution_fields(db_session):
    attempt = attempt_service.create_attempt(db_session, "parking-lot")
    eval_svc = evaluation_service.EvaluationService()
    sub_in = SubmissionCreate(
        classes="",
        responsibilities="",
        relationships="",
        explanation=""
    )
    updated_attempt = eval_svc.process_submission(db_session, attempt.id, sub_in)
    assert updated_attempt.status == AttemptStatus.COMPLETED.value
    # Score should be penalty score for empty/vague submission
    assert updated_attempt.submission.evaluation.overall_score <= 65

def test_code_and_diagram_submission_modes(db_session):
    attempt = attempt_service.create_attempt(db_session, "parking-lot")
    eval_svc = evaluation_service.EvaluationService()
    sub_in = SubmissionCreate(
        submission_type="CODE",
        code_content="class ParkingLot:\n    def __init__(self):\n        self.spots = []",
        code_language="python",
        explanation="Implemented in Python using clean classes."
    )
    updated_attempt = eval_svc.process_submission(db_session, attempt.id, sub_in)
    assert updated_attempt.status == AttemptStatus.COMPLETED.value
    assert updated_attempt.submission.submission_type == "CODE"
    assert updated_attempt.submission.code_content != ""
