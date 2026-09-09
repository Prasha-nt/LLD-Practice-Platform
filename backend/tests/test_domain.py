import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.domain.models import Base, AttemptStatus
from app.services import problem_service, attempt_service, evaluation_service
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

def test_create_attempt_initial_state(db_session):
    attempt = attempt_service.create_attempt(db_session, "parking-lot")
    assert attempt.status == AttemptStatus.DRAFT.value
    assert attempt.attempt_number == 1
    assert attempt.problem_id == "parking-lot"

def test_attempt_number_increments(db_session):
    att1 = attempt_service.create_attempt(db_session, "parking-lot")
    att2 = attempt_service.create_attempt(db_session, "parking-lot")
    assert att1.attempt_number == 1
    assert att2.attempt_number == 2

def test_submission_state_transition(db_session):
    attempt = attempt_service.create_attempt(db_session, "parking-lot")
    assert attempt.status == AttemptStatus.DRAFT.value

    eval_svc = evaluation_service.EvaluationService()
    sub_in = SubmissionCreate(
        classes="ParkingLot, ParkingSpot, Vehicle",
        responsibilities="ParkingLot manages spots. ParkingSpot holds Vehicle.",
        relationships="ParkingLot HAS MANY ParkingSpot",
        explanation="I used polymorphism for Vehicle types."
    )

    updated_attempt = eval_svc.process_submission(db_session, attempt.id, sub_in)
    assert updated_attempt.status == AttemptStatus.COMPLETED.value
    assert updated_attempt.submission is not None
    assert updated_attempt.submission.evaluation is not None
    assert updated_attempt.submission.evaluation.overall_score > 0
