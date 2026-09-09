"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchProblemById, submitSolution, createAttempt, Problem, SubmissionData } from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Info,
  Loader2,
  Send,
  Sparkles,
  Zap,
  Code2,
  FileText,
  GitFork,
  Lightbulb,
  Layers,
  FileCode,
  Workflow,
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function PracticeWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const problemId = resolvedParams.id;
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get("attemptId");

  const router = useRouter();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(attemptIdParam);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-modal Submission State
  const [submissionMode, setSubmissionMode] = useState<"COMBINED" | "STRUCTURED_TEXT" | "CODE" | "DIAGRAM">("COMBINED");
  const [editorTab, setEditorTab] = useState<"text" | "code" | "diagram">("text");

  // Box Height Preset (Compact, Medium, Expanded)
  const [textareaRows, setTextareaRows] = useState<number>(6);

  // Form State
  const [classes, setClasses] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [relationships, setRelationships] = useState("");
  const [explanation, setExplanation] = useState("");
  
  // Code Submission State
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<"python" | "java" | "cpp" | "typescript">("python");

  // Diagram Submission State
  const [diagramCode, setDiagramCode] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const prob = await fetchProblemById(problemId);
        setProblem(prob);

        let currentAttemptId = attemptIdParam;
        if (!currentAttemptId) {
          const attempt = await createAttempt(problemId);
          currentAttemptId = attempt.id;
          setAttemptId(attempt.id);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to initialize practice session");
        setLoading(false);
      }
    }
    init();
  }, [problemId, attemptIdParam]);

  // Code Template Generator by Problem & Language
  const getCodeSample = (probId: string, lang: string) => {
    const isParking = probId.includes("parking");
    const isVending = probId.includes("vending");

    if (lang === "java") {
      if (isParking) {
        return `import java.util.*;
import java.time.LocalDateTime;

enum VehicleType { BIKE, CAR, TRUCK }

abstract class Vehicle {
    private String licensePlate;
    private VehicleType type;
    public Vehicle(String licensePlate, VehicleType type) {
        this.licensePlate = licensePlate;
        this.type = type;
    }
    public VehicleType getType() { return type; }
}

class Car extends Vehicle {
    public Car(String licensePlate) {
        super(licensePlate, VehicleType.CAR);
    }
}

abstract class ParkingSpot {
    private String spotId;
    private boolean occupied;
    private Vehicle vehicle;
    public ParkingSpot(String spotId) { this.spotId = spotId; }

    public synchronized boolean assignVehicle(Vehicle v) {
        if (!occupied) {
            this.vehicle = v;
            this.occupied = true;
            return true;
        }
        return false;
    }
}

class Ticket {
    private String ticketId;
    private String spotId;
    private LocalDateTime entryTime = LocalDateTime.now();
    public Ticket(String ticketId, String spotId) {
        this.ticketId = ticketId;
        this.spotId = spotId;
    }
}`;
      } else if (isVending) {
        return `interface VendingState {
    void insertCoin(VendingMachine machine, double amount);
    void selectProduct(VendingMachine machine, String productId);
}

class IdleState implements VendingState {
    public void insertCoin(VendingMachine machine, double amount) {
        machine.addBalance(amount);
        machine.setState(machine.getHasMoneyState());
    }
    public void selectProduct(VendingMachine machine, String productId) {
        System.out.println("Insert coin first.");
    }
}

class VendingMachine {
    private double balance = 0.0;
    private VendingState currentState = new IdleState();
    private VendingState hasMoneyState;

    public void addBalance(double amt) { balance += amt; }
    public void setState(VendingState state) { this.currentState = state; }
    public VendingState getHasMoneyState() { return hasMoneyState; }
}`;
      } else {
        return `abstract class ElevatorController {
    protected List<ElevatorCar> cars;
    public abstract void requestElevator(int floor, String direction);
}

class ElevatorCar {
    private int currentFloor = 1;
    private boolean isMoving = false;
    public synchronized void moveToFloor(int target) {
        this.currentFloor = target;
    }
}`;
      }
    } else if (lang === "typescript") {
      if (isParking) {
        return `enum VehicleType { BIKE = "BIKE", CAR = "CAR", TRUCK = "TRUCK" }

abstract class Vehicle {
  constructor(public licensePlate: string, public vehicleType: VehicleType) {}
}

class Car extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.CAR);
  }
}

abstract class ParkingSpot {
  public isOccupied: boolean = false;
  public vehicle: Vehicle | null = null;
  constructor(public spotId: string) {}

  public assignVehicle(v: Vehicle): boolean {
    if (!this.isOccupied) {
      this.vehicle = v;
      this.isOccupied = true;
      return true;
    }
    return false;
  }
}

class Ticket {
  public entryTime: Date = new Date();
  constructor(public ticketId: string, public spotId: string) {}
}`;
      } else if (isVending) {
        return `interface VendingState {
  insertCoin(machine: VendingMachine, amount: number): void;
  selectProduct(machine: VendingMachine, productId: string): void;
}

class IdleState implements VendingState {
  insertCoin(machine: VendingMachine, amount: number): void {
    machine.balance += amount;
    machine.setState(machine.hasMoneyState);
  }
  selectProduct(machine: VendingMachine, productId: string): void {
    console.log("Insert coins first.");
  }
}

class VendingMachine {
  public balance: number = 0.0;
  public hasMoneyState!: VendingState;
  private currentState: VendingState = new IdleState();

  public setState(state: VendingState): void {
    this.currentState = state;
  }
}`;
      } else {
        return `abstract class DispatcherStrategy {
  abstract selectElevator(cars: ElevatorCar[], floor: number): ElevatorCar;
}

class ElevatorCar {
  public currentFloor: number = 1;
  public isMoving: boolean = false;
  public moveTo(floor: number): void {
    this.currentFloor = floor;
  }
}`;
      }
    } else if (lang === "cpp") {
      if (isParking) {
        return `#include <iostream>
#include <string>
#include <memory>

enum class VehicleType { BIKE, CAR, TRUCK };

class Vehicle {
protected:
    std::string licensePlate;
    VehicleType type;
public:
    Vehicle(std::string plate, VehicleType t) : licensePlate(plate), type(t) {}
    virtual ~Vehicle() = default;
};

class Car : public Vehicle {
public:
    Car(std::string plate) : Vehicle(plate, VehicleType::CAR) {}
};

class ParkingSpot {
private:
    std::string spotId;
    bool isOccupied = false;
    std::shared_ptr<Vehicle> vehicle;
public:
    ParkingSpot(std::string id) : spotId(id) {}
    bool assignVehicle(std::shared_ptr<Vehicle> v) {
        if (!isOccupied) {
            vehicle = v;
            isOccupied = true;
            return true;
        }
        return false;
    }
};`;
      } else {
        return `#include <iostream>
#include <memory>

class VendingMachine;

class VendingState {
public:
    virtual void insertCoin(VendingMachine& machine, double amount) = 0;
    virtual void selectProduct(VendingMachine& machine, std::string id) = 0;
    virtual ~VendingState() = default;
};

class VendingMachine {
private:
    double balance = 0.0;
    std::shared_ptr<VendingState> currentState;
public:
    void addBalance(double amt) { balance += amt; }
    void setState(std::shared_ptr<VendingState> state) { currentState = state; }
};`;
      }
    } else {
      // Default: Python
      if (isParking) {
        return `from abc import ABC, abstractmethod
from datetime import datetime

class VehicleType:
    BIKE = "BIKE"
    CAR = "CAR"
    TRUCK = "TRUCK"

class Vehicle(ABC):
    def __init__(self, license_plate: str, vehicle_type: str):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Car(Vehicle):
    def __init__(self, license_plate: str):
        super().__init__(license_plate, VehicleType.CAR)

class ParkingSpot(ABC):
    def __init__(self, spot_id: str, spot_type: str):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.is_occupied = False
        self.vehicle = None

    def assign_vehicle(self, vehicle: Vehicle) -> bool:
        if not self.is_occupied:
            self.vehicle = vehicle
            self.is_occupied = True
            return True
        return False

class Ticket:
    def __init__(self, ticket_id: str, spot_id: str, vehicle_plate: str):
        self.ticket_id = ticket_id
        self.spot_id = spot_id
        self.vehicle_plate = vehicle_plate
        self.entry_time = datetime.now()

class PaymentService:
    def calculate_fee(self, ticket: Ticket, rate_per_hour: float = 10.0) -> float:
        duration_hours = max(1.0, (datetime.now() - ticket.entry_time).total_seconds() / 3600)
        return duration_hours * rate_per_hour
`;
      } else {
        return `from abc import ABC, abstractmethod

class VendingMachineState(ABC):
    @abstractmethod
    def insert_coin(self, machine, amount: float): pass
    @abstractmethod
    def select_product(self, machine, product_id: str): pass

class IdleState(VendingMachineState):
    def insert_coin(self, machine, amount: float):
        machine.balance += amount
        machine.set_state(machine.has_money_state)

class VendingMachine:
    def __init__(self):
        self.balance = 0.0
        self.idle_state = IdleState()
        self.current_state = self.idle_state

    def set_state(self, state: VendingMachineState):
        self.current_state = state
`;
      }
    }
  };

  // Handle language selector change
  const handleLanguageChange = (newLang: "python" | "java" | "cpp" | "typescript") => {
    setCodeLanguage(newLang);
    setCodeContent(getCodeSample(problemId, newLang));
  };

  // Sample pre-fill template helper (Text + Code + Diagram!)
  const handleLoadSampleTemplate = () => {
    if (problemId.includes("parking")) {
      setClasses(`ParkingLot\nParkingFloor\nParkingSpot (abstract)\nCompactSpot, LargeSpot, MotorcycleSpot\nVehicle (abstract)\nCar, Bike, Truck\nTicket\nPaymentService\nNotificationService`);
      setResponsibilities(`ParkingLot:\n- Manages collection of ParkingFloors\n- Delegates spot search to allocation strategy\n\nParkingSpot:\n- Stores vehicle reference\n- Tracks availability state\n\nTicket:\n- Stores entry timestamp, spotId, vehicleId\n\nPaymentService:\n- Calculates fee based on duration and vehicle type`);
      setRelationships(`ParkingLot HAS MANY ParkingFloor\nParkingFloor HAS MANY ParkingSpot\nParkingSpot HAS ONE Vehicle\nCar IS-A Vehicle\nBike IS-A Vehicle\nTruck IS-A Vehicle\nParkingLot USES PaymentService`);
      setExplanation(`I chose an abstract Vehicle class and abstract ParkingSpot class to allow polymorphic spot matching. PaymentService is extracted out of ParkingLot to strictly adhere to the Single Responsibility Principle (SRP). A Strategy Pattern can be used for spot assignment (e.g. NearestEntryStrategy).`);
      
      setCodeContent(getCodeSample(problemId, codeLanguage));

      setDiagramCode(`classDiagram
    class ParkingLot {
        -String id
        -List~ParkingFloor~ floors
        +assignSpot(vehicle: Vehicle) Ticket
        +releaseSpot(ticket: Ticket) Fee
    }
    class ParkingFloor {
        -int floorNumber
        -List~ParkingSpot~ spots
    }
    class ParkingSpot {
        <<abstract>>
        -String spotId
        -bool isOccupied
        +assignVehicle(v: Vehicle) bool
    }
    class Vehicle {
        <<abstract>>
        -String licensePlate
    }
    class Ticket {
        -String ticketId
        -DateTime entryTime
    }
    class PaymentService {
        +calculateFee(ticket: Ticket) float
    }

    ParkingLot "1" *-- "many" ParkingFloor
    ParkingFloor "1" *-- "many" ParkingSpot
    ParkingSpot "1" o-- "0..1" Vehicle
    ParkingLot ..> Ticket : creates
    ParkingLot ..> PaymentService : uses
`);
    } else {
      setClasses(`VendingMachine\nVendingState (interface)\nIdleState, HasMoneyState, DispenseState\nInventory\nProduct\nPaymentProcessor`);
      setResponsibilities(`VendingMachine:\n- Holds current VendingState\n- Manages Inventory & Coin reserve\n\nVendingState:\n- Defines insertCoin(), selectProduct(), dispenseItem(), refund()\n\nInventory:\n- Tracks stock count per product slot`);
      setRelationships(`VendingMachine HAS-A VendingState\nVendingMachine HAS-A Inventory\nIdleState IMPLEMENTS VendingState\nDispenseState IMPLEMENTS VendingState`);
      setExplanation(`Applied the State Pattern to handle vending state transitions cleanly without nested switch-cases.`);

      setCodeContent(getCodeSample(problemId, codeLanguage));

      setDiagramCode(`classDiagram
    class VendingMachine {
        -float balance
        -VendingState currentState
        +setState(state: VendingState)
    }
    class VendingState {
        <<interface>>
        +insertCoin(amount: float)
        +selectProduct(id: String)
    }
    VendingMachine "1" o-- "1" VendingState
`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptId) return;

    try {
      setSubmitting(true);
      const submissionData: SubmissionData = {
        submission_type: submissionMode,
        classes: classes.trim(),
        responsibilities: responsibilities.trim(),
        relationships: relationships.trim(),
        explanation: explanation.trim(),
        code_content: codeContent.trim(),
        code_language: codeLanguage,
        diagram_code: diagramCode.trim()
      };

      const result = await submitSolution(attemptId, submissionData);
      router.push(`/attempts/${result.id}`);
    } catch (err: any) {
      alert("Error submitting solution: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Preparing workspace &amp; problem statement...</span>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="py-20 text-center text-rose-400 max-w-lg mx-auto">
        <p className="font-bold text-lg">Error</p>
        <p className="text-sm mt-1">{error || "Problem not found"}</p>
      </div>
    );
  }

  const hasAnyInput = classes.trim() || codeContent.trim() || diagramCode.trim();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/problems")}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white flex items-center space-x-2">
              <span>{problem.title}</span>
              <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Attempt Session
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Box Size Adjuster Toggle */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Box Height:</span>
            {[
              { label: "Compact", r: 5 },
              { label: "Medium", r: 9 },
              { label: "Expanded", r: 15 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTextareaRows(preset.r)}
                className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-all ${
                  textareaRows === preset.r
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Submission Format Selector */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { mode: "COMBINED", label: "Multi-Modal", icon: Layers },
              { mode: "STRUCTURED_TEXT", label: "Structured Text", icon: FileText },
              { mode: "CODE", label: "Source Code", icon: FileCode },
              { mode: "DIAGRAM", label: "Mermaid Diagram", icon: Workflow },
            ].map((m) => {
              const Icon = m.icon;
              const isSel = submissionMode === m.mode;
              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => {
                    setSubmissionMode(m.mode as any);
                    if (m.mode === "STRUCTURED_TEXT") setEditorTab("text");
                    if (m.mode === "CODE") setEditorTab("code");
                    if (m.mode === "DIAGRAM") setEditorTab("diagram");
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                    isSel ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleLoadSampleTemplate}
            className="text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Solution</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || !hasAnyInput}
            className="inline-flex items-center space-x-2 px-5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Solution...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Solution</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split Pane Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Requirements & Constraints (5 Cols) */}
        <div className="lg:col-span-5 border-r border-slate-800 bg-slate-950 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Problem Statement</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  problem.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">{problem.description}</p>
          </div>

          {/* Requirements & Constraints */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Functional Requirements</span>
            </h3>
            <ul className="space-y-2">
              {problem.requirements.map((req, idx) => (
                <li key={idx} className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-2.5">
                  <span className="font-mono text-indigo-400 font-bold">{idx + 1}.</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Constraints</span>
            </h3>
            <ul className="space-y-1.5">
              {problem.constraints.map((c, idx) => (
                <li key={idx} className="text-xs text-slate-400 flex items-start space-x-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>Expected Architectural Considerations</span>
            </h4>
            <ul className="space-y-1">
              {problem.expected_considerations.map((ec, idx) => (
                <li key={idx} className="text-xs text-indigo-200/80 flex items-start space-x-2">
                  <span>-</span>
                  <span>{ec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Pane: Multi-Modal Solution Workspace (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/40 overflow-y-auto p-6 space-y-6 flex flex-col">
          {/* Sub-Editor Tab switcher for COMBINED mode */}
          {submissionMode === "COMBINED" && (
            <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEditorTab("text")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                  editorTab === "text"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>1. Structured Text</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab("code")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                  editorTab === "code"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>2. Code Implementation</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab("diagram")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                  editorTab === "diagram"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Workflow className="w-4 h-4" />
                <span>3. Class Diagram</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto flex-1 w-full">
            {/* TAB 1: STRUCTURED TEXT */}
            {(editorTab === "text" || submissionMode === "STRUCTURED_TEXT") && (
              <div className="space-y-6">
                {/* Section 1: Classes */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      <span>Classes &amp; Entities</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">Drag bottom-right handle to resize</span>
                  </label>
                  <textarea
                    rows={textareaRows}
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                    placeholder={`Example:\nParkingLot\nParkingFloor\nParkingSpot (abstract)\nVehicle (abstract)\nCar, Bike, Truck\nTicket`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y min-h-[100px]"
                  />
                </div>

                {/* Section 2: Responsibilities */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <span>Responsibilities &amp; State Design</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">Method-level responsibilities</span>
                  </label>
                  <textarea
                    rows={textareaRows}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder={`Example:\nParkingLot:\n- manages parking floors\n- assigns spots via allocation strategy\n\nParkingSpot:\n- holds vehicle reference & tracks availability state`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y min-h-[100px]"
                  />
                </div>

                {/* Section 3: Relationships */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <GitFork className="w-4 h-4 text-amber-400" />
                      <span>Class Relationships &amp; Associations</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">HAS-MANY, IS-A, Composition</span>
                  </label>
                  <textarea
                    rows={textareaRows}
                    value={relationships}
                    onChange={(e) => setRelationships(e.target.value)}
                    placeholder={`Example:\nParkingLot HAS MANY ParkingFloor\nParkingFloor HAS MANY ParkingSpot\nCar IS-A Vehicle`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y min-h-[100px]"
                  />
                </div>

                {/* Section 4: Design Explanation */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      <span>Design Rationale &amp; Trade-offs</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">Justify patterns &amp; abstractions</span>
                  </label>
                  <textarea
                    rows={textareaRows}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={`Example:\nI used Vehicle as an abstract base class because different vehicle types share common attributes. I extracted PaymentService out of ParkingLot to adhere to SRP.`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans resize-y min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SOURCE CODE EDITOR */}
            {(editorTab === "code" || submissionMode === "CODE") && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span>Source Code Implementation</span>
                  </label>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400">Language:</span>
                    <select
                      value={codeLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={textareaRows + 8}
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder={`// Write your ${codeLanguage} class definitions, methods, and design pattern implementations here...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-emerald-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 selection:bg-indigo-600 resize-y min-h-[220px]"
                />
              </div>
            )}

            {/* TAB 3: MERMAID DIAGRAM EDITOR */}
            {(editorTab === "diagram" || submissionMode === "DIAGRAM") && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-white flex items-center space-x-2">
                    <Workflow className="w-4 h-4 text-amber-400" />
                    <span>Mermaid Class Diagram Code</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Mermaid / PlantUML syntax (Drag bottom-right handle to resize)</span>
                </div>

                <textarea
                  rows={textareaRows + 6}
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  placeholder={`classDiagram\n    class ParkingLot {\n        -List~ParkingFloor~ floors\n        +assignSpot(v: Vehicle)\n    }\n    ParkingLot "1" *-- "many" ParkingFloor`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-amber-300 font-mono leading-relaxed focus:outline-none focus:border-amber-500 resize-y min-h-[180px]"
                />
              </div>
            )}

            {/* Submit button bar */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-500">
                {hasAnyInput ? "Artifact input detected" : "Provide text, code, or diagram to submit"}
              </span>

              <button
                type="submit"
                disabled={submitting || !hasAnyInput}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Solution...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit &amp; Evaluate Design</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
