import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type FloorId = 1 | 2 | 3 | 4 | 5;

export interface NpcAgent {
  id: string;
  name: string;
  role: string;
  floor: FloorId;
  color: string;
  positionX: number;
  positionZ: number;
  status: "idle" | "working" | "chatting" | "moving";
  currentTask: string;
  personality: string;
  department: string;
}

export const FLOOR_THEMES: Record<FloorId, { name: string; color: string; accent: string; emoji: string; department: string }> = {
  1: { name: "Engineering",   color: "#1e3a5f", accent: "#3b82f6", emoji: "⚙️",  department: "Core Dev" },
  2: { name: "Design Studio", color: "#3d1f5f", accent: "#a855f7", emoji: "🎨",  department: "UX & Brand" },
  3: { name: "Data & AI",     color: "#1a4a3a", accent: "#10b981", emoji: "🧠",  department: "AI Research" },
  4: { name: "Operations",    color: "#4a3000", accent: "#f59e0b", emoji: "🚀",  department: "DevOps" },
  5: { name: "Executive",     color: "#3a1a1a", accent: "#ef4444", emoji: "👔",  department: "Leadership" },
};

const NPC_AGENTS: NpcAgent[] = [
  // Floor 2 — Design Studio
  { id: "f2-1", name: "LYRA",   role: "UI/UX Designer",       floor: 2, color: "#a855f7", positionX: -5,  positionZ: -3, status: "working",  currentTask: "Designing component library", personality: "creative, detail-oriented, enthusiastic about color theory",        department: "Design" },
  { id: "f2-2", name: "NOVA",   role: "Brand Designer",       floor: 2, color: "#ec4899", positionX: -1,  positionZ: -3, status: "working",  currentTask: "Creating brand guidelines",    personality: "artistic, perfectionist, loves minimalist aesthetics",              department: "Design" },
  { id: "f2-3", name: "PIXEL",  role: "Motion Designer",      floor: 2, color: "#8b5cf6", positionX:  3,  positionZ: -3, status: "chatting", currentTask: "Animating onboarding flow",    personality: "dynamic, fast-thinking, obsessed with micro-interactions",          department: "Design" },
  { id: "f2-4", name: "FRAME",  role: "Product Designer",     floor: 2, color: "#d946ef", positionX: -5,  positionZ:  3, status: "idle",     currentTask: "User research synthesis",      personality: "empathetic, user-centric, data-informed designer",                  department: "Design" },
  { id: "f2-5", name: "SKETCH", role: "Design Systems Eng",   floor: 2, color: "#c084fc", positionX: -1,  positionZ:  3, status: "working",  currentTask: "Building design tokens",       personality: "systematic, bridge between design and engineering",                 department: "Design" },
  { id: "f2-6", name: "HAZE",   role: "3D Artist",            floor: 2, color: "#e879f9", positionX:  3,  positionZ:  3, status: "working",  currentTask: "Modeling UI illustrations",     personality: "spatial thinker, loves depth and dimension in interfaces",          department: "Design" },
  // Floor 3 — Data & AI
  { id: "f3-1", name: "SIGMA",  role: "ML Engineer",          floor: 3, color: "#10b981", positionX: -5,  positionZ: -3, status: "working",  currentTask: "Training recommendation model", personality: "analytical, data-driven, thinks in probabilities",                 department: "AI" },
  { id: "f3-2", name: "DELTA",  role: "Data Scientist",       floor: 3, color: "#34d399", positionX: -1,  positionZ: -3, status: "working",  currentTask: "Analyzing user behavior",       personality: "curious, hypothesis-driven, loves finding patterns",                department: "AI" },
  { id: "f3-3", name: "QUBIT",  role: "AI Researcher",        floor: 3, color: "#6ee7b7", positionX:  3,  positionZ: -3, status: "chatting", currentTask: "Writing research paper",         personality: "deep thinker, fascinated by emergent intelligence",                 department: "AI" },
  { id: "f3-4", name: "TENSOR", role: "Data Engineer",        floor: 3, color: "#059669", positionX: -5,  positionZ:  3, status: "working",  currentTask: "Building ETL pipeline",         personality: "pragmatic, infrastructure-focused, loves clean data",               department: "AI" },
  { id: "f3-5", name: "FLUX",   role: "MLOps Engineer",       floor: 3, color: "#047857", positionX: -1,  positionZ:  3, status: "idle",     currentTask: "Monitoring model drift",         personality: "operational, bridges research and production",                     department: "AI" },
  { id: "f3-6", name: "APEX",   role: "Computer Vision Eng",  floor: 3, color: "#065f46", positionX:  3,  positionZ:  3, status: "working",  currentTask: "Training image classifier",      personality: "visual thinker, obsessed with object detection accuracy",           department: "AI" },
  // Floor 4 — Operations
  { id: "f4-1", name: "OPS-1",  role: "DevOps Engineer",      floor: 4, color: "#f59e0b", positionX: -5,  positionZ: -3, status: "working",  currentTask: "Configuring Kubernetes cluster", personality: "practical, reliability-obsessed, measures everything",             department: "Ops" },
  { id: "f4-2", name: "PIPE",   role: "Platform Engineer",    floor: 4, color: "#fbbf24", positionX: -1,  positionZ: -3, status: "working",  currentTask: "Building CI/CD pipeline",        personality: "automation-first, hates manual processes",                         department: "Ops" },
  { id: "f4-3", name: "CLOUD",  role: "Cloud Architect",      floor: 4, color: "#fcd34d", positionX:  3,  positionZ: -3, status: "chatting", currentTask: "Designing multi-region setup",    personality: "strategic, cost-conscious, thinks at massive scale",                department: "Ops" },
  { id: "f4-4", name: "MESH",   role: "Network Engineer",     floor: 4, color: "#d97706", positionX: -5,  positionZ:  3, status: "working",  currentTask: "Optimizing CDN routing",         personality: "latency-obsessed, packet-level thinker",                           department: "Ops" },
  { id: "f4-5", name: "VAULT",  role: "Security Engineer",    floor: 4, color: "#b45309", positionX: -1,  positionZ:  3, status: "idle",     currentTask: "Pen testing auth flow",           personality: "paranoid (in a good way), zero-trust advocate",                    department: "Ops" },
  { id: "f4-6", name: "HELM",   role: "SRE",                  floor: 4, color: "#92400e", positionX:  3,  positionZ:  3, status: "working",  currentTask: "Incident postmortem analysis",   personality: "calm under pressure, blameless culture champion",                  department: "Ops" },
  // Floor 5 — Executive
  { id: "f5-1", name: "CEO",    role: "Chief Executive",      floor: 5, color: "#ef4444", positionX:  0,  positionZ: -4, status: "working",  currentTask: "Reviewing Q4 strategy",          personality: "visionary, decisive, big-picture thinker who trusts data",         department: "Leadership" },
  { id: "f5-2", name: "CTO",    role: "Chief Technology",     floor: 5, color: "#dc2626", positionX: -4,  positionZ: -2, status: "chatting", currentTask: "Technical roadmap review",       personality: "technical visionary, bridges engineering and business",            department: "Leadership" },
  { id: "f5-3", name: "CPO",    role: "Chief Product",        floor: 5, color: "#b91c1c", positionX:  4,  positionZ: -2, status: "working",  currentTask: "Product strategy alignment",     personality: "customer-obsessed, metric-driven product philosopher",             department: "Leadership" },
  { id: "f5-4", name: "CFO",    role: "Chief Financial",      floor: 5, color: "#991b1b", positionX: -4,  positionZ:  2, status: "idle",     currentTask: "Budget forecasting",             personality: "precise, risk-aware, sees everything through ROI lens",            department: "Leadership" },
  { id: "f5-5", name: "CMO",    role: "Chief Marketing",      floor: 5, color: "#7f1d1d", positionX:  4,  positionZ:  2, status: "working",  currentTask: "Campaign performance review",    personality: "storyteller, brand guardian, growth-obsessed",                     department: "Leadership" },
  { id: "f5-6", name: "ASSIST", role: "Executive Assistant",  floor: 5, color: "#fca5a5", positionX:  0,  positionZ:  4, status: "chatting", currentTask: "Coordinating board meeting",     personality: "hyper-organized, anticipates needs, masters of logistics",         department: "Leadership" },
];

interface FloorContextType {
  currentFloor: FloorId;
  setFloor: (floor: FloorId) => void;
  isElevatorOpen: boolean;
  openElevator: () => void;
  closeElevator: () => void;
  isRiding: boolean;
  npcAgents: NpcAgent[];
  getNpcsByFloor: (floor: FloorId) => NpcAgent[];
}

const FloorContext = createContext<FloorContextType | null>(null);

export function FloorProvider({ children }: { children: ReactNode }) {
  const [currentFloor, setCurrentFloor] = useState<FloorId>(1);
  const [isElevatorOpen, setElevatorOpen] = useState(false);
  const [isRiding, setIsRiding] = useState(false);

  const setFloor = useCallback((floor: FloorId) => {
    if (floor === currentFloor) { setElevatorOpen(false); return; }
    setIsRiding(true);
    setTimeout(() => {
      setCurrentFloor(floor);
      setIsRiding(false);
      setElevatorOpen(false);
    }, 1800);
  }, [currentFloor]);

  const getNpcsByFloor = useCallback((floor: FloorId) => {
    return NPC_AGENTS.filter(a => a.floor === floor);
  }, []);

  return (
    <FloorContext.Provider value={{
      currentFloor,
      setFloor,
      isElevatorOpen,
      openElevator: () => setElevatorOpen(true),
      closeElevator: () => setElevatorOpen(false),
      isRiding,
      npcAgents: NPC_AGENTS,
      getNpcsByFloor,
    }}>
      {children}
    </FloorContext.Provider>
  );
}

export function useFloor() {
  const ctx = useContext(FloorContext);
  if (!ctx) throw new Error("useFloor must be used inside FloorProvider");
  return ctx;
}
