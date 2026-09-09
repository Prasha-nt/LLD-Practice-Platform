from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from app.domain.models import AttemptDB, AttemptStatus, SubmissionDB, EvaluationDB, FeedbackCriterionDB, ProblemDB
from app.domain.schemas import SubmissionCreate
from app.evaluation.strategy import EvaluationStrategy
from app.evaluation.ai_evaluator import AIEvaluator

logger = logging.getLogger("evaluation_service")

class EvaluationService:
    def __init__(self, evaluator_strategy: EvaluationStrategy = None):
        self.evaluator = evaluator_strategy or AIEvaluator()

    def process_submission(self, db: Session, attempt_id: str, submission_in: SubmissionCreate) -> AttemptDB:
        attempt = db.query(AttemptDB).filter(AttemptDB.id == attempt_id).first()
        if not attempt:
            raise ValueError(f"Attempt '{attempt_id}' not found.")

        # State transition validation
        if attempt.status in [AttemptStatus.EVALUATING.value, AttemptStatus.COMPLETED.value]:
            logger.warning(f"Attempt '{attempt_id}' is already in state '{attempt.status}'. Returning current state.")
            return attempt

        # 1. Transition state to SUBMITTED
        attempt.status = AttemptStatus.SUBMITTED.value
        attempt.submitted_at = datetime.now(timezone.utc)
        db.commit()

        # 2. Create or Update Submission
        sub_type = submission_in.submission_type.value if hasattr(submission_in.submission_type, "value") else str(submission_in.submission_type)

        submission = db.query(SubmissionDB).filter(SubmissionDB.attempt_id == attempt_id).first()
        if not submission:
            submission = SubmissionDB(
                attempt_id=attempt_id,
                submission_type=sub_type,
                classes=submission_in.classes or "",
                responsibilities=submission_in.responsibilities or "",
                relationships=submission_in.relationships or "",
                explanation=submission_in.explanation or "",
                code_content=submission_in.code_content or "",
                code_language=submission_in.code_language or "python",
                diagram_code=submission_in.diagram_code or ""
            )
            db.add(submission)
        else:
            submission.submission_type = sub_type
            submission.classes = submission_in.classes or ""
            submission.responsibilities = submission_in.responsibilities or ""
            submission.relationships = submission_in.relationships or ""
            submission.explanation = submission_in.explanation or ""
            submission.code_content = submission_in.code_content or ""
            submission.code_language = submission_in.code_language or "python"
            submission.diagram_code = submission_in.diagram_code or ""

        # 3. Transition state to EVALUATING
        attempt.status = AttemptStatus.EVALUATING.value
        db.commit()
        db.refresh(submission)

        try:
            # 4. Fetch problem metadata
            problem = db.query(ProblemDB).filter(ProblemDB.id == attempt.problem_id).first()
            problem_details = {
                "id": problem.id,
                "title": problem.title,
                "requirements": problem.requirements,
                "constraints": problem.constraints
            }

            submission_data = {
                "submission_type": submission.submission_type,
                "classes": submission.classes,
                "responsibilities": submission.responsibilities,
                "relationships": submission.relationships,
                "explanation": submission.explanation,
                "code_content": submission.code_content,
                "code_language": submission.code_language,
                "diagram_code": submission.diagram_code
            }

            # 5. Execute Evaluation Strategy
            eval_result = self.evaluator.evaluate(problem_details, submission_data)

            # 6. Save Evaluation & Criteria Feedback
            existing_eval = db.query(EvaluationDB).filter(EvaluationDB.submission_id == submission.id).first()
            if existing_eval:
                db.delete(existing_eval)
                db.commit()

            evaluation = EvaluationDB(
                submission_id=submission.id,
                evaluator_type=eval_result.evaluator_type,
                overall_score=eval_result.overall_score,
                strengths=eval_result.strengths,
                improvements=eval_result.improvements
            )
            db.add(evaluation)
            db.commit()
            db.refresh(evaluation)

            for crit in eval_result.criteria_feedback:
                criterion_db = FeedbackCriterionDB(
                    evaluation_id=evaluation.id,
                    criterion_name=crit.criterion_name,
                    weight_percentage=crit.weight_percentage,
                    score=crit.score,
                    max_score=crit.max_score,
                    evidence=crit.evidence,
                    concern=crit.concern,
                    suggestion=crit.suggestion,
                    confidence=crit.confidence
                )
                db.add(criterion_db)

            # 7. Transition state to COMPLETED
            attempt.status = AttemptStatus.COMPLETED.value
            attempt.error_message = None
            db.commit()
            db.refresh(attempt)

        except Exception as e:
            logger.error(f"Evaluation error on attempt '{attempt_id}': {e}", exc_info=True)
            attempt.status = AttemptStatus.FAILED.value
            attempt.error_message = f"Evaluation failed: {str(e)}. Submission is safely saved. You can retry evaluation."
            db.commit()
            db.refresh(attempt)

        return attempt
