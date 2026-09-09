from app.evaluation.mock_evaluator import MockEvaluator
from app.evaluation.rule_evaluator import RuleBasedEvaluator
from app.evaluation.ai_evaluator import AIEvaluator

def test_mock_evaluator_rubric_dimensions():
    evaluator = MockEvaluator()
    problem_details = {
        "id": "parking-lot",
        "title": "Parking Lot System",
        "requirements": ["Multi-floor", "Bike, Car, Truck"]
    }
    submission = {
        "classes": "ParkingLot, ParkingFloor, ParkingSpot, Vehicle, Car, Bike, Ticket",
        "responsibilities": "ParkingLot manages floors. ParkingSpot stores vehicle. Vehicle holds plate.",
        "relationships": "ParkingLot HAS MANY ParkingFloor. ParkingFloor HAS MANY ParkingSpot.",
        "explanation": "Abstract Vehicle class used for polymorphism. Strategy pattern used for allocation."
    }

    res = evaluator.evaluate(problem_details, submission)
    assert res.overall_score >= 70
    assert len(res.criteria_feedback) == 8
    assert any(c.criterion_name == "Responsibilities" for c in res.criteria_feedback)
    assert any(c.criterion_name == "Extensibility" for c in res.criteria_feedback)

def test_rule_evaluator_deterministic_behavior():
    evaluator = RuleBasedEvaluator()
    problem_details = {"id": "parking-lot", "title": "Parking Lot"}
    submission = {
        "classes": "ParkingLot",
        "responsibilities": "Manages lot",
        "relationships": "None",
        "explanation": "Simple design"
    }

    res = evaluator.evaluate(problem_details, submission)
    assert res.evaluator_type == "RULE_ENGINE"
    assert res.overall_score > 0
    assert len(res.criteria_feedback) == 8

def test_ai_evaluator_fallback_without_key():
    evaluator = AIEvaluator()
    problem_details = {"id": "parking-lot", "title": "Parking Lot"}
    submission = {
        "classes": "ParkingLot",
        "responsibilities": "Manages lot",
        "relationships": "None",
        "explanation": "Simple design"
    }
    res = evaluator.evaluate(problem_details, submission)
    assert res.overall_score > 0
    assert len(res.criteria_feedback) == 8
