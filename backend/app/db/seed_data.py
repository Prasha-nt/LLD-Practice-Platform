from sqlalchemy.orm import Session
from app.domain.models import ProblemDB

SEED_PROBLEMS = [
    {
        "id": "parking-lot",
        "title": "Parking Lot System",
        "difficulty": "Beginner",
        "category": "Object-Oriented Design",
        "description": "Design an automated multi-floor parking lot management system that handles vehicle entry, spot allocation based on vehicle dimensions, ticket issuance, and exit fee calculation.",
        "requirements": [
            "The parking lot can have multiple floors with different spot types (Compact, Large, Motorcycle).",
            "Supported vehicle types: Bike (Motorcycle), Car, and Truck.",
            "Vehicle must be assigned a compatible parking spot (e.g. Car can fit in Compact or Large, Truck only in Large).",
            "System issues a unique ParkingTicket containing spot number, entry timestamp, and vehicle details upon entry.",
            "Upon exit, the spot becomes available immediately and the system releases the spot.",
            "The system should support real-time querying of available spots per floor for each vehicle type."
        ],
        "constraints": [
            "A parking spot can fit at most one vehicle at a time.",
            "The system must handle concurrent entry/exit requests without double-booking a spot.",
            "Assume spot allocation strategy can be extended later (e.g. nearest to entrance, lowest floor first)."
        ],
        "expected_considerations": [
            "Separation of concerns between ParkingLot, ParkingFloor, ParkingSpot, and Vehicle.",
            "Extensibility for new vehicle types (e.g. Electric Vehicle with charging requirement).",
            "Thread safety / concurrency strategy consideration for spot booking.",
            "Avoid placing payment/billing logic directly inside the main ParkingLot orchestrator class."
        ]
    },
    {
        "id": "vending-machine",
        "title": "Vending Machine System",
        "difficulty": "Beginner",
        "category": "State Pattern & Hardware Integration",
        "description": "Design a vending machine system that manages product inventory, accepts cash/coins, dispenses items, handles refund/cancellation, and manages state transitions cleanly.",
        "requirements": [
            "Vending machine holds products across multiple inventory slots with fixed capacity and pricing.",
            "Supports states: Idle State, Has Money State, Dispense State, and Out of Stock State.",
            "User selects a product slot and inserts coins/bills of various denominations ($1, $5, 10c, 25c).",
            "If inserted amount >= item price, dispense item and return change. If insufficient, prompt for more funds.",
            "User can cancel transaction at any point before dispensing and get full refund."
        ],
        "constraints": [
            "Dispensing must be atomic — inventory decrements only after item release.",
            "Machine cannot accept money if out of change or during maintenance mode."
        ],
        "expected_considerations": [
            "Use of State Pattern to eliminate giant conditional switch-cases.",
            "Encapsulation of Inventory management separated from Money/Payment handling.",
            "Clear definition of user actions vs machine internal state transitions."
        ]
    },
    {
        "id": "elevator-system",
        "title": "Elevator Control System",
        "difficulty": "Intermediate",
        "category": "Concurreny & Dispatching Algorithms",
        "description": "Design an intelligent elevator controller for a high-rise building with N elevator cars, handling internal cabin floor selections and external hall calls efficiently.",
        "requirements": [
            "Building has N floors and M elevator cars.",
            "Elevator states: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN, OUT_OF_SERVICE.",
            "External hall buttons (UP/DOWN at floor K) and internal cabin destination buttons.",
            "Dispatcher algorithm assigns external requests to the optimal elevator car (e.g. minimum wait time).",
            "Safety checks: maximum weight capacity warning and door obstacle detection."
        ],
        "constraints": [
            "Elevator cars operate independently under centralized dispatcher control.",
            "The system must handle peak traffic patterns (morning up-peak, evening down-peak)."
        ],
        "expected_considerations": [
            "Strategy Pattern for dispatching algorithms (e.g. SCAN, LOOK, Shortest Seek Time).",
            "Decoupling Elevator Controller from Elevator Car state representation.",
            "Handling edge cases like weight limit exceeded or manual emergency stops."
        ]
    },
    {
        "id": "tic-tac-toe",
        "title": "Tic-Tac-Toe Game Engine",
        "difficulty": "Intermediate",
        "category": "Game Design & Extensibility",
        "description": "Design a scalable, extensible N x N Tic-Tac-Toe game supporting custom win conditions, multiple players (Human & AI), and move undo capability.",
        "requirements": [
            "Board size of N x N (default 3x3) with K consecutive symbols required to win.",
            "Supports 2 or more players with unique pieces (X, O, $, #).",
            "Players take turns placing pieces on valid empty grid positions.",
            "Game evaluates win condition after each move in O(1) or O(N) time.",
            "Supports move history log, undo last move, and AI player bot with basic/minimax strategy."
        ],
        "constraints": [
            "Grid must validate bounds and reject occupied slots.",
            "Win validation logic must be decoupled from Board rendering."
        ],
        "expected_considerations": [
            "Use of Strategy Pattern for AI Player algorithms and Win Checking strategies.",
            "Command Pattern or Memento Pattern for Move Undo / Redo functionality.",
            "Extensibility for variant board shapes or dynamic winning rules."
        ]
    }
]

def seed_problems(db: Session):
    for problem_data in SEED_PROBLEMS:
        existing = db.query(ProblemDB).filter(ProblemDB.id == problem_data["id"]).first()
        if not existing:
            problem = ProblemDB(**problem_data)
            db.add(problem)
    db.commit()
