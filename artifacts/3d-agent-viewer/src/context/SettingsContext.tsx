import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { audioManager } from "@/lib/audioManager";

export type ApiProvider = "openclaw" | "openai" | "anthropic" | "groq" | "kimi";
export type GraphicsQuality = "low" | "medium" | "high" | "ultra";
export type FpsLimit = 30 | 60 | 120 | 0;

export interface Settings {
  apiKey: string;
  apiProvider: ApiProvider;
  playerName: string;
  playerColor: string;
  playerSkinTone: string;
  playerHairColor: string;
  playerHairStyle: "short" | "medium" | "long" | "bun";
  openclawGatewayUrl: string;
  openclawAgentId: string;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  fpsLimit: FpsLimit;
  shadowsEnabled: boolean;
  antialias: boolean;
  showFPS: boolean;
  pixelRatio: number;
  bloomEnabled: boolean;
  fogEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  hasApiKey: boolean;
}

const DEFAULT: Settings = {
  apiKey: "",
  apiProvider: "openclaw",
  playerName: "You",
  playerColor: "#f59e0b",
  playerSkinTone: "#f4c39a",
  playerHairColor: "#1a0f06",
  playerHairStyle: "short",
  openclawGatewayUrl: "https://openclaw.ai",
  openclawAgentId: "default",
  masterVolume: 0.7,
  musicVolume: 0.45,
  sfxVolume: 0.8,
  graphicsQuality: "high",
  fpsLimit: 0,
  shadowsEnabled: false,
  antialias: true,
  showFPS: false,
  pixelRatio: 1,
  bloomEnabled: true,
  fogEnabled: true,
};

const QUALITY_PRESETS: Record<GraphicsQuality, Partial<Settings>> = {
  low:    { shadowsEnabled: false, antialias: false, pixelRatio: 0.5, bloomEnabled: false, fogEnabled: false },
  medium: { shadowsEnabled: false, antialias: false, pixelRatio: 0.75, bloomEnabled: false, fogEnabled: true  },
  high:   { shadowsEnabled: false, antialias: true,  pixelRatio: 1,    bloomEnabled: true,  fogEnabled: true  },
  ultra:  { shadowsEnabled: true,  antialias: true,  pixelRatio: 1.5,  bloomEnabled: true,  fogEnabled: true  },
};

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("dlavie_settings");
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings>;
      // Migrate old localhost OpenClaw URLs to the public default
      if (saved.openclawGatewayUrl && /localhost|127\.0\.0\.1/.test(saved.openclawGatewayUrl)) {
        saved.openclawGatewayUrl = DEFAULT.openclawGatewayUrl;
      }
      return { ...DEFAULT, ...saved };
    }
  } catch {}
  return DEFAULT;
}

function saveSettings(s: Settings) {
  try { localStorage.setItem("dlavie_settings", JSON.stringify(s)); } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    audioManager.setMasterVolume(settings.masterVolume);
    audioManager.setMusicVolume(settings.musicVolume);
    audioManager.setSfxVolume(settings.sfxVolume);
  }, [settings.masterVolume, settings.musicVolume, settings.sfxVolume]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      let merged = { ...prev, ...patch };
      if (patch.graphicsQuality && patch.graphicsQuality !== prev.graphicsQuality) {
        merged = { ...merged, ...QUALITY_PRESETS[patch.graphicsQuality] };
      }
      saveSettings(merged);
      return merged;
    });
  }, []);

  const isOpenClaw = settings.apiProvider === "openclaw";

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      isSettingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      hasApiKey: isOpenClaw
        ? !!settings.openclawGatewayUrl.trim()
        : !!settings.apiKey.trim(),
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
