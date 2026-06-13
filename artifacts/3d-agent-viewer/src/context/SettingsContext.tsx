import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ApiProvider = "openai" | "anthropic" | "groq" | "kimi" | "openclaw";

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
  apiProvider: "openai",
  playerName: "You",
  playerColor: "#f59e0b",
  playerSkinTone: "#f4c39a",
  playerHairColor: "#1a0f06",
  playerHairStyle: "short",
  openclawGatewayUrl: "http://localhost:18789",
  openclawAgentId: "default",
};

const SettingsContext = createContext<SettingsContextType | null>(null);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("dlavie_settings");
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

function saveSettings(s: Settings) {
  try { localStorage.setItem("dlavie_settings", JSON.stringify(s)); } catch {}
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      isSettingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      hasApiKey: settings.apiProvider === "openclaw"
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
