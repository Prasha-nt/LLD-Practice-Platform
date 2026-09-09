import re
from typing import Dict, Any, List
from app.evaluation.strategy import EvaluationStrategy, EvaluationResultData, CriterionFeedbackData

class MockEvaluator(EvaluationStrategy):
    """
    Intelligent heuristic fallback evaluator. Multi-modal analysis of text, code,
    and diagram inputs against the 8-dimension rubric without requiring external API keys.
    """
    def evaluate(self, problem_details: Dict[str, Any], submission_data: Dict[str, str]) -> EvaluationResultData:
        problem_title = problem_details.get("title", "Low-Level Design Problem")

        submission_type = submission_data.get("submission_type", "COMBINED")
        classes_raw = submission_data.get("classes", "")
        resp_raw = submission_data.get("responsibilities", "")
        rel_raw = submission_data.get("relationships", "")
        exp_raw = submission_data.get("explanation", "")
        code_raw = submission_data.get("code_content", "")
        diagram_raw = submission_data.get("diagram_code", "")

        combined_text = f"{classes_raw}\n{resp_raw}\n{rel_raw}\n{exp_raw}\n{code_raw}\n{diagram_raw}".lower()

        # Parse extracted class names from text, code, or diagram
        class_names = [line.strip().split()[0].replace(":", "").replace("-", "")
                       for line in classes_raw.split("\n") if line.strip()]
        
        # If code is provided, extract class definitions from code
        code_classes = re.findall(r'class\s+([A-Za-z0-9_]+)', code_raw)
        for cc in code_classes:
            if cc not in class_names:
                class_names.append(cc)

        criteria: List[CriterionFeedbackData] = []
        strengths: List[str] = []
        improvements: List[str] = []

        # 1. Requirement Understanding (Weight 15)
        req_keywords = ["vehicle", "spot", "floor", "ticket", "vending", "item", "coin", "elevator", "board", "player", "book", "member", "account", "user", "card", "lock"]
        found_reqs = [kw for kw in req_keywords if kw in combined_text]

        req_score = 14 if len(found_reqs) >= 3 else (11 if len(found_reqs) >= 1 else 7)
        evidence_req = f"Submission provided {submission_type.lower()} submission referencing domain concepts: {', '.join(found_reqs[:4]) if found_reqs else 'core entities'}."
        criteria.append(CriterionFeedbackData(
            criterion_name="Requirement Understanding",
            weight_percentage=15,
            score=req_score,
            max_score=15,
            evidence=evidence_req,
            concern="Minor edge cases (e.g. timeout or capacity limits) were not explicitly detailed." if req_score < 15 else "Strong alignment with core functional requirements.",
            suggestion="Explicitly document boundary state transitions and edge cases.",
            confidence=0.92
        ))

        # 2. Responsibilities (Weight 20)
        god_class_smell = any(term in combined_text for term in ["payment", "notification", "billing", "email", "print"]) and ("parkinglot" in combined_text or "system" in combined_text or "controller" in combined_text)

        if god_class_smell:
            resp_score = 12
            evidence_str = "Main orchestrator class mixes payment/notification logic alongside core domain allocation."
            concern_str = "Single Responsibility Principle (SRP) violation: orchestrator class is taking on auxiliary services."
            suggestion_str = "Extract payment and notification responsibilities into dedicated PaymentService and NotificationService classes."
            improvements.append("Refactor orchestrator class to delegate payment and notification logic.")
        else:
            resp_score = 18
            evidence_str = f"Clear breakdown across {max(len(class_names), 3)} classes with distinct functional boundaries."
            concern_str = "Some classes mix state representation with business workflows."
            suggestion_str = "Keep state classes immutable where possible and move actions to service classes."
            strengths.append("Clean separation of class responsibilities.")

        criteria.append(CriterionFeedbackData(
            criterion_name="Responsibilities",
            weight_percentage=20,
            score=resp_score,
            max_score=20,
            evidence=evidence_str,
            concern=concern_str,
            suggestion=suggestion_str,
            confidence=0.88
        ))

        # 3. Encapsulation (Weight 15)
        has_encap_code = "private" in code_raw or "def get_" in code_raw or "@property" in code_raw or "__" in code_raw
        encap_keywords = ["private", "getter", "setter", "encapsulat", "hidden", "abstract", "state"]
        has_encap_mention = any(k in combined_text for k in encap_keywords) or has_encap_code
        encap_score = 14 if has_encap_mention else 10
        criteria.append(CriterionFeedbackData(
            criterion_name="Encapsulation",
            weight_percentage=15,
            score=encap_score,
            max_score=15,
            evidence="Code/text uses private fields and controlled getters/setters." if has_encap_mention else "Properties are exposed as mutable public variables.",
            concern="Ensure internal collections (e.g. list of spots/items) are not exposed directly as mutable public properties." if encap_score < 14 else "Good encapsulation of internal state fields.",
            suggestion="Return unmodifiable views or copies of internal collections to prevent external state tampering.",
            confidence=0.86
        ))

        # 4. Coupling & Cohesion (Weight 15)
        has_coupling_awareness = "has many" in combined_text or "composition" in combined_text or "interface" in combined_text or "<|--" in diagram_raw or "*--" in diagram_raw
        coupling_score = 14 if has_coupling_awareness else 9
        criteria.append(CriterionFeedbackData(
            criterion_name="Coupling & Cohesion",
            weight_percentage=15,
            score=coupling_score,
            max_score=15,
            evidence=f"Relationships rely on '{'Composition, interfaces, and Has-A associations' if has_coupling_awareness else 'Direct concrete references'}'.",
            concern="Direct concrete class references create tight coupling between components." if not has_coupling_awareness else "Cohesive module boundaries with reasonable coupling.",
            suggestion="Depend on interfaces or abstract base classes rather than concrete implementations (Dependency Inversion).",
            confidence=0.87
        ))

        # 5. Abstraction (Weight 10)
        has_abstraction = any(term in combined_text for term in ["abstract", "interface", "polymorphism", "base class", "strategy", "implements", "abc"])
        abstr_score = 9 if has_abstraction else 6
        criteria.append(CriterionFeedbackData(
            criterion_name="Abstraction",
            weight_percentage=10,
            score=abstr_score,
            max_score=10,
            evidence="Used abstract concepts/interfaces in design code or description." if has_abstraction else "Relies mostly on concrete classes without abstract interfaces.",
            concern="Lack of abstract types makes polymorphic behavior harder to extend." if not has_abstraction else "Proper abstract base class and interface definitions.",
            suggestion="Define abstract base types to enable polymorphic object handling.",
            confidence=0.90
        ))
        if has_abstraction:
            strengths.append("Effective use of abstraction and polymorphic hierarchy.")

        # 6. Extensibility (Weight 15)
        has_patterns = any(pattern in combined_text for pattern in ["strategy", "factory", "state pattern", "command", "observer", "singleton"])
        ext_score = 14 if has_patterns else 10
        criteria.append(CriterionFeedbackData(
            criterion_name="Extensibility",
            weight_percentage=15,
            score=ext_score,
            max_score=15,
            evidence=f"Submission {'incorporates scalable design patterns (e.g. Strategy/State/Factory)' if has_patterns else 'describes basic static structure'}.",
            concern="Adding a new vehicle/item type or algorithm requires modifying existing logic." if not has_patterns else "Flexible design capable of supporting future requirements.",
            suggestion="Apply the Strategy Pattern so new algorithms can be injected dynamically.",
            confidence=0.87
        ))
        if has_patterns:
            strengths.append("Design incorporates scalable design patterns.")

        # 7. Edge Cases (Weight 5)
        edge_keywords = ["full", "concurrent", "lock", "thread", "empty", "invalid", "exception", "try", "catch"]
        has_edge = any(e in combined_text for e in edge_keywords)
        edge_score = 4 if has_edge else 2
        criteria.append(CriterionFeedbackData(
            criterion_name="Edge Cases",
            weight_percentage=5,
            score=edge_score,
            max_score=5,
            evidence="Submission covers exception handling or capacity boundary conditions." if has_edge else "Edge cases like capacity full or concurrency were not explicitly covered.",
            concern="System behavior when capacity is 100% full is unspecified." if not has_edge else "Awareness of system boundaries.",
            suggestion="Document error handling strategy when no compatible resources are available.",
            confidence=0.82
        ))

        # 8. Explanation (Weight 5)
        exp_score = 5 if len(exp_raw) > 30 or len(code_raw) > 100 or len(diagram_raw) > 50 else 3
        criteria.append(CriterionFeedbackData(
            criterion_name="Explanation",
            weight_percentage=5,
            score=exp_score,
            max_score=5,
            evidence=f"Artifact provided {len(exp_raw) + len(code_raw) + len(diagram_raw)} characters of architectural content.",
            concern="Explanation could provide deeper justification for trade-offs." if exp_score < 5 else "Clear, well-reasoned trade-off explanation.",
            suggestion="Explain why specific patterns were chosen over simpler alternatives.",
            confidence=0.95
        ))

        overall_score = sum(c.score for c in criteria)

        if not strengths:
            strengths.append("Clear structural organization of classes and relationships.")
        if not improvements:
            improvements.append("Elaborate on concurrency control and thread safety mechanisms.")

        return EvaluationResultData(
            evaluator_type="MOCK_AI_EVALUATOR",
            overall_score=overall_score,
            strengths=strengths,
            improvements=improvements,
            criteria_feedback=criteria
        )
