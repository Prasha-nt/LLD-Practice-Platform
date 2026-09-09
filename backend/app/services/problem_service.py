import re
from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.models import ProblemDB
from app.domain.schemas import ProblemCreate

def get_all_problems(db: Session) -> List[ProblemDB]:
    return db.query(ProblemDB).order_by(ProblemDB.created_at.desc()).all()

def get_problem_by_id(db: Session, problem_id: str) -> Optional[ProblemDB]:
    return db.query(ProblemDB).filter(ProblemDB.id == problem_id).first()

def create_problem(db: Session, problem_in: ProblemCreate) -> ProblemDB:
    # Generate unique slug ID
    slug = re.sub(r'[^a-z0-9]+', '-', problem_in.title.lower()).strip('-')
    if not slug:
        slug = "custom-problem"
    
    # Check if slug exists
    count = db.query(ProblemDB).filter(ProblemDB.id.like(f"{slug}%")).count()
    if count > 0:
        slug = f"{slug}-{count + 1}"

    problem = ProblemDB(
        id=slug,
        title=problem_in.title,
        difficulty=problem_in.difficulty,
        category=problem_in.category,
        description=problem_in.description,
        requirements=problem_in.requirements,
        constraints=problem_in.constraints or ["System should be extensible and follow SOLID principles."],
        expected_considerations=problem_in.expected_considerations or ["Clean separation of concerns and OOP class hierarchy."]
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return problem
