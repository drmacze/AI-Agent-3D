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
  status: "idle" | "working" | "chatting" | "moving" | "coffee" | "presenting";
  currentTask: string;
  personality: string;
  department: string;
  specialty?: string;
}

export const FLOOR_THEMES: Record<FloorId, { name: string; color: string; accent: string; emoji: string; department: string }> = {
  1: { name: "Engineering",   color: "#1e3a5f", accent: "#3b82f6", emoji: "⚙️",  department: "Core Dev" },
  2: { name: "Design Studio", color: "#3d1f5f", accent: "#a855f7", emoji: "🎨",  department: "UX & Brand" },
  3: { name: "Data & AI",     color: "#1a4a3a", accent: "#10b981", emoji: "🧠",  department: "AI Research" },
  4: { name: "Operations",    color: "#4a3000", accent: "#f59e0b", emoji: "🚀",  department: "DevOps" },
  5: { name: "Executive",     color: "#3a1a1a", accent: "#ef4444", emoji: "👔",  department: "Leadership" },
};

const NPC_AGENTS: NpcAgent[] = [
  // ─── Floor 2 — Design Studio ─────────────────────────────────────────────
  { id: "f2-1", name: "LYRA",   role: "UI/UX Designer",       floor: 2, color: "#a855f7", positionX: -5,  positionZ: -3, status: "working",    currentTask: "Designing component library",     personality: "creative, detail-oriented, enthusiastic about color theory",       department: "Design", specialty: "UI" },
  { id: "f2-2", name: "NOVA",   role: "Brand Designer",       floor: 2, color: "#ec4899", positionX: -1,  positionZ: -3, status: "working",    currentTask: "Creating brand guidelines",       personality: "artistic, perfectionist, loves minimalist aesthetics",             department: "Design", specialty: "Brand" },
  { id: "f2-3", name: "PIXEL",  role: "Motion Designer",      floor: 2, color: "#8b5cf6", positionX:  3,  positionZ: -3, status: "chatting",   currentTask: "Animating onboarding flow",       personality: "dynamic, fast-thinking, obsessed with micro-interactions",         department: "Design", specialty: "Motion" },
  { id: "f2-4", name: "FRAME",  role: "Product Designer",     floor: 2, color: "#d946ef", positionX: -5,  positionZ:  3, status: "presenting", currentTask: "User research synthesis",         personality: "empathetic, user-centric, data-informed designer",                 department: "Design", specialty: "Product" },
  { id: "f2-5", name: "SKETCH", role: "Design Systems Eng",   floor: 2, color: "#c084fc", positionX: -1,  positionZ:  3, status: "working",    currentTask: "Building design tokens",          personality: "systematic, bridge between design and engineering",                department: "Design", specialty: "Systems" },
  { id: "f2-6", name: "HAZE",   role: "3D Artist",            floor: 2, color: "#e879f9", positionX:  3,  positionZ:  3, status: "working",    currentTask: "Modeling UI illustrations",       personality: "spatial thinker, loves depth and dimension in interfaces",         department: "Design", specialty: "3D" },
  { id: "f2-7", name: "CYAN",   role: "Accessibility Eng",    floor: 2, color: "#06b6d4", positionX:  7,  positionZ: -1, status: "working",    currentTask: "WCAG audit & remediation",        personality: "inclusive thinker, advocates for every user regardless of ability", department: "Design", specialty: "A11y" },
  { id: "f2-8", name: "FLORA",  role: "UX Researcher",        floor: 2, color: "#f472b6", positionX: -9,  positionZ:  1, status: "coffee",     currentTask: "Conducting user interviews",      personality: "empathetic listener, loves uncovering hidden pain points",          department: "Design", specialty: "Research" },

  // ─── Floor 3 — Data & AI ─────────────────────────────────────────────────
  { id: "f3-1", name: "SIGMA",  role: "ML Engineer",          floor: 3, color: "#10b981", positionX: -5,  positionZ: -3, status: "working",    currentTask: "Training recommendation model",  personality: "analytical, data-driven, thinks in probabilities",                 department: "AI", specialty: "ML" },
  { id: "f3-2", name: "DELTA",  role: "Data Scientist",       floor: 3, color: "#34d399", positionX: -1,  positionZ: -3, status: "working",    currentTask: "Analyzing user behavior",        personality: "curious, hypothesis-driven, loves finding patterns",               department: "AI", specialty: "Data" },
  { id: "f3-3", name: "QUBIT",  role: "AI Researcher",        floor: 3, color: "#6ee7b7", positionX:  3,  positionZ: -3, status: "chatting",   currentTask: "Writing research paper",          personality: "deep thinker, fascinated by emergent intelligence",                department: "AI", specialty: "Research" },
  { id: "f3-4", name: "TENSOR", role: "Data Engineer",        floor: 3, color: "#059669", positionX: -5,  positionZ:  3, status: "working",    currentTask: "Building ETL pipeline",           personality: "pragmatic, infrastructure-focused, loves clean data",              department: "AI", specialty: "ETL" },
  { id: "f3-5", name: "FLUX",   role: "MLOps Engineer",       floor: 3, color: "#047857", positionX: -1,  positionZ:  3, status: "idle",       currentTask: "Monitoring model drift",          personality: "operational, bridges research and production",                    department: "AI", specialty: "MLOps" },
  { id: "f3-6", name: "APEX",   role: "Computer Vision Eng",  floor: 3, color: "#065f46", positionX:  3,  positionZ:  3, status: "working",    currentTask: "Training image classifier",       personality: "visual thinker, obsessed with object detection accuracy",          department: "AI", specialty: "Vision" },
  { id: "f3-7", name: "BYTE",   role: "LLM Engineer",         floor: 3, color: "#14b8a6", positionX:  7,  positionZ: -2, status: "working",    currentTask: "Fine-tuning language model",      personality: "language obsessed, fascinated by token prediction and emergence",   department: "AI", specialty: "LLM" },
  { id: "f3-8", name: "PULSE",  role: "RL Researcher",        floor: 3, color: "#2dd4bf", positionX: -9,  positionZ:  2, status: "presenting", currentTask: "RLHF alignment experiment",       personality: "game theory fan, reward hacker, optimization junkie",               department: "AI", specialty: "RL" },

  // ─── Floor 4 — Operations ────────────────────────────────────────────────
  { id: "f4-1", name: "OPS-1",  role: "DevOps Engineer",      floor: 4, color: "#f59e0b", positionX: -5,  positionZ: -3, status: "working",    currentTask: "Configuring Kubernetes cluster",  personality: "practical, reliability-obsessed, measures everything",             department: "Ops", specialty: "K8s" },
  { id: "f4-2", name: "PIPE",   role: "Platform Engineer",    floor: 4, color: "#fbbf24", positionX: -1,  positionZ: -3, status: "working",    currentTask: "Building CI/CD pipeline",         personality: "automation-first, hates manual processes",                        department: "Ops", specialty: "CI/CD" },
  { id: "f4-3", name: "CLOUD",  role: "Cloud Architect",      floor: 4, color: "#fcd34d", positionX:  3,  positionZ: -3, status: "chatting",   currentTask: "Designing multi-region setup",    personality: "strategic, cost-conscious, thinks at massive scale",               department: "Ops", specialty: "Cloud" },
  { id: "f4-4", name: "MESH",   role: "Network Engineer",     floor: 4, color: "#d97706", positionX: -5,  positionZ:  3, status: "working",    currentTask: "Optimizing CDN routing",          personality: "latency-obsessed, packet-level thinker",                          department: "Ops", specialty: "Network" },
  { id: "f4-5", name: "VAULT",  role: "Security Engineer",    floor: 4, color: "#b45309", positionX: -1,  positionZ:  3, status: "idle",       currentTask: "Pen testing auth flow",           personality: "paranoid (in a good way), zero-trust advocate",                   department: "Ops", specialty: "Security" },
  { id: "f4-6", name: "HELM",   role: "SRE",                  floor: 4, color: "#92400e", positionX:  3,  positionZ:  3, status: "working",    currentTask: "Incident postmortem analysis",    personality: "calm under pressure, blameless culture champion",                  department: "Ops", specialty: "SRE" },
  { id: "f4-7", name: "PROTO",  role: "Infra Engineer",       floor: 4, color: "#f97316", positionX:  7,  positionZ: -1, status: "coffee",     currentTask: "Provisioning staging env",        personality: "infrastructure as code zealot, Terraform evangelist",              department: "Ops", specialty: "IaC" },
  { id: "f4-8", name: "TRACE",  role: "Observability Eng",    floor: 4, color: "#fb923c", positionX: -9,  positionZ:  1, status: "working",    currentTask: "Distributed tracing setup",       personality: "obsessed with observability, hates black boxes",                   department: "Ops", specialty: "Obs" },

  // ─── Floor 5 — Executive ─────────────────────────────────────────────────
  { id: "f5-1", name: "CEO",    role: "Chief Executive",      floor: 5, color: "#ef4444", positionX:  0,  positionZ: -4, status: "working",    currentTask: "Reviewing Q4 strategy",           personality: "visionary, decisive, big-picture thinker who trusts data",        department: "Leadership", specialty: "Strategy" },
  { id: "f5-2", name: "CTO",    role: "Chief Technology",     floor: 5, color: "#dc2626", positionX: -4,  positionZ: -2, status: "chatting",   currentTask: "Technical roadmap review",        personality: "technical visionary, bridges engineering and business",           department: "Leadership", specialty: "Tech" },
  { id: "f5-3", name: "CPO",    role: "Chief Product",        floor: 5, color: "#b91c1c", positionX:  4,  positionZ: -2, status: "working",    currentTask: "Product strategy alignment",      personality: "customer-obsessed, metric-driven product philosopher",            department: "Leadership", specialty: "Product" },
  { id: "f5-4", name: "CFO",    role: "Chief Financial",      floor: 5, color: "#991b1b", positionX: -4,  positionZ:  2, status: "idle",       currentTask: "Budget forecasting",              personality: "precise, risk-aware, sees everything through ROI lens",           department: "Leadership", specialty: "Finance" },
  { id: "f5-5", name: "CMO",    role: "Chief Marketing",      floor: 5, color: "#7f1d1d", positionX:  4,  positionZ:  2, status: "working",    currentTask: "Campaign performance review",     personality: "storyteller, brand guardian, growth-obsessed",                    department: "Leadership", specialty: "Marketing" },
  { id: "f5-6", name: "ASSIST", role: "Executive Assistant",  floor: 5, color: "#fca5a5", positionX:  0,  positionZ:  4, status: "chatting",   currentTask: "Coordinating board meeting",      personality: "hyper-organized, anticipates needs, master of logistics",         department: "Leadership", specialty: "Coordination" },
  { id: "f5-7", name: "LEGAL",  role: "General Counsel",      floor: 5, color: "#f87171", positionX: -7,  positionZ:  0, status: "working",    currentTask: "IP portfolio review",             personality: "precise, risk-mitigating, contractual-minded thinker",            department: "Leadership", specialty: "Legal" },
  { id: "f5-8", name: "PRESS",  role: "Chief Communications", floor: 5, color: "#fda4af", positionX:  7,  positionZ:  0, status: "coffee",     currentTask: "Press release drafting",          personality: "storyteller, media-savvy, crafts narratives that stick",          department: "Leadership", specialty: "PR" },
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
  if (!ctx) throw new Error("useFloor must be inside FloorProvider");
  return ctx;
}
