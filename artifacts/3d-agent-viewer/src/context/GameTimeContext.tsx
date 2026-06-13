import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 1 real second = 1 game minute → full 24-hour day in 24 real minutes
const GAME_SPEED_MINUTES_PER_SECOND = 1;
const INITIAL_GAME_HOUR = 8; // Office opens at 8 AM

export type TimePhase = "night" | "dawn" | "morning" | "afternoon" | "evening" | "dusk";

export interface LightConfig {
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  fillColor: string;
  fillIntensity: number;
  bgColor: string;
  windowGlow: string;
  windowGlowIntensity: number;
}

export interface GameTime {
  hour: number;
  minute: number;
  timeString: string;
  phase: TimePhase;
  lightConfig: LightConfig;
}

const LIGHT_CONFIGS: Record<TimePhase, LightConfig> = {
  night: {
    ambientColor: "#7080b0", ambientIntensity: 0.45,
    sunColor: "#2a3560",    sunIntensity: 0.15,
    fillColor: "#5060a0",   fillIntensity: 0.35,
    bgColor: "#1a2040",
    windowGlow: "#3050a0",  windowGlowIntensity: 0.15,
  },
  dawn: {
    ambientColor: "#ffd4b0", ambientIntensity: 0.9,
    sunColor: "#ff7030",    sunIntensity: 1.0,
    fillColor: "#ffb070",   fillIntensity: 0.4,
    bgColor: "#ff9060",
    windowGlow: "#ffa060",  windowGlowIntensity: 0.55,
  },
  morning: {
    ambientColor: "#fff8f0", ambientIntensity: 1.4,
    sunColor: "#fff5e0",    sunIntensity: 1.8,
    fillColor: "#e8f2ff",   fillIntensity: 0.7,
    bgColor: "#c8e4f8",
    windowGlow: "#c8e8ff",  windowGlowIntensity: 0.35,
  },
  afternoon: {
    ambientColor: "#f0f8ff", ambientIntensity: 1.65,
    sunColor: "#ffffff",    sunIntensity: 2.1,
    fillColor: "#d8e8ff",   fillIntensity: 0.8,
    bgColor: "#88ccf0",
    windowGlow: "#b0d8ff",  windowGlowIntensity: 0.4,
  },
  evening: {
    ambientColor: "#ffe4b0", ambientIntensity: 1.1,
    sunColor: "#ff8020",    sunIntensity: 1.3,
    fillColor: "#ffd090",   fillIntensity: 0.45,
    bgColor: "#ff8040",
    windowGlow: "#ffb060",  windowGlowIntensity: 0.6,
  },
  dusk: {
    ambientColor: "#d0a0c0", ambientIntensity: 0.65,
    sunColor: "#c05040",    sunIntensity: 0.45,
    fillColor: "#a07090",   fillIntensity: 0.35,
    bgColor: "#804060",
    windowGlow: "#c06060",  windowGlowIntensity: 0.4,
  },
};

function getPhase(hour: number): TimePhase {
  if (hour >= 5 && hour < 7)  return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 22) return "dusk";
  return "night";
}

function buildGameTime(totalMinutes: number): GameTime {
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const phase = getPhase(hour);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return {
    hour, minute, phase,
    timeString: `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`,
    lightConfig: LIGHT_CONFIGS[phase],
  };
}

const GameTimeContext = createContext<GameTime | null>(null);

export function GameTimeProvider({ children }: { children: ReactNode }) {
  const [totalMinutes, setTotalMinutes] = useState(INITIAL_GAME_HOUR * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setTotalMinutes((m) => (m + GAME_SPEED_MINUTES_PER_SECOND) % (24 * 60));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <GameTimeContext.Provider value={buildGameTime(totalMinutes)}>
      {children}
    </GameTimeContext.Provider>
  );
}

export function useGameTime(): GameTime {
  const ctx = useContext(GameTimeContext);
  if (!ctx) throw new Error("useGameTime must be inside GameTimeProvider");
  return ctx;
}
