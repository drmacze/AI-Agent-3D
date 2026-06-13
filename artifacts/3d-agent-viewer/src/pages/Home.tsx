import { useState, useCallback, useEffect } from "react";
import { FloorScene } from "@/components/3d/FloorScene";
import { audioManager } from "@/lib/audioManager";
import { AgentListHUD } from "@/components/hud/AgentListHUD";
import { ActivityFeedHUD } from "@/components/hud/ActivityFeedHUD";
import { SelectedAgentHUD } from "@/components/hud/SelectedAgentHUD";
import { ChatOverlay } from "@/components/ui/ChatOverlay";
import { ElevatorUI } from "@/components/ui/ElevatorUI";
import { FloorIndicator } from "@/components/ui/FloorIndicator";
import { LobbyScreen } from "@/components/ui/LobbyScreen";
import { InGameHUD } from "@/components/ui/InGameHUD";
import { ChevronLeft, ChevronRight, Users, Rss } from "lucide-react";
import { useFloor } from "@/context/FloorContext";
import { useGameStore } from "@/store/gameStore";
import type { NpcAgent } from "@/context/FloorContext";
import type { Agent } from "@workspace/api-client-react";

type ChatTarget = (Agent & { isNpc?: false }) | (NpcAgent & { isNpc: true }) | null;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function useIsPortrait() {
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  useEffect(() => {
    const handler = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);
  return portrait;
}

export default function Home() {
  const isMobile = useIsMobile();
  const isPortrait = useIsPortrait();
  const [selectedAgentId, setSelectedAgentId] = useState<number | string | null>(null);
  const [chatTarget, setChatTarget] = useState<ChatTarget>(null);
  const [leftOpen, setLeftOpen] = useState(!isMobile);
  const [rightOpen, setRightOpen] = useState(false);
  const [nearNpcName, setNearNpcName] = useState<string | null>(null);
  const [nearNpcData, setNearNpcData] = useState<unknown>(null);
  const [nearElevator, setNearElevator] = useState(false);
  const { currentFloor, openElevator } = useFloor();
  const { gameState, setGameState } = useGameStore();

  // Collapse panels in FPS mode or on mobile
  useEffect(() => {
    if (gameState === "playing") {
      setLeftOpen(false);
      setRightOpen(false);
    } else {
      setLeftOpen(!isMobile);
      setRightOpen(false);
    }
  }, [gameState, isMobile]);

  useEffect(() => {
    if (gameState === "playing") {
      audioManager.resume();
      audioManager.startAmbientMusic();
      // Auto-rotate to landscape on mobile
      try {
        screen.orientation?.lock?.("landscape-primary").catch(() => {});
      } catch {}
    } else {
      audioManager.stopAmbientMusic();
      try { screen.orientation?.unlock?.(); } catch {}
    }
    return () => {
      audioManager.stopAmbientMusic();
      try { screen.orientation?.unlock?.(); } catch {}
    };
  }, [gameState]);

  const handleSelectAgent = useCallback((id: number | string) => setSelectedAgentId(id), []);
  const handleChatAgent = useCallback((agent: unknown) => setChatTarget(agent as ChatTarget), []);
  const handleCloseSelected = useCallback(() => setSelectedAgentId(null), []);
  const handleNearNpc = useCallback((name: string | null, agentData?: unknown) => {
    setNearNpcName(name);
    setNearNpcData(agentData ?? null);
  }, []);
  const handleNearElevator = useCallback((near: boolean) => setNearElevator(near), []);
  const handleInteract = useCallback(() => {
    if (nearNpcData) setChatTarget(nearNpcData as ChatTarget);
  }, [nearNpcData]);
  const handleElevatorInteract = useCallback(() => openElevator(), [openElevator]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && nearNpcData) handleInteract();
      else if (e.code === "KeyE" && nearElevator) handleElevatorInteract();
      if (e.code === "Escape") document.exitPointerLock?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, nearNpcData, nearElevator, handleInteract, handleElevatorInteract]);

  return (
    <div className="absolute inset-0 bg-background w-full h-full flex overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <FloorScene
          onSelectAgent={handleSelectAgent}
          selectedAgentId={selectedAgentId}
          onChatAgent={handleChatAgent}
          onNearNpc={handleNearNpc}
          onNearElevator={handleNearElevator}
        />
      </div>

      {/* Lobby overlay */}
      {gameState === "lobby" && <LobbyScreen />}

      {/* In-game HUD */}
      {gameState === "playing" && (
        <InGameHUD
          nearNpcName={nearNpcName}
          onInteract={handleInteract}
          nearElevator={nearElevator}
          onElevatorInteract={handleElevatorInteract}
        />
      )}

      {/* HUD overlay */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col transition-opacity duration-300 ${gameState === "lobby" ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="flex flex-1 overflow-hidden min-w-0">

          {/* Left panel */}
          <div className="flex items-start pt-3 pl-2 sm:pl-3 gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${leftOpen ? "w-56 sm:w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100dvh - 110px)" }}
            >
              <div className="w-56 sm:w-64 h-full">
                <AgentListHUD
                  onSelectAgent={(id) => handleSelectAgent(id)}
                  selectedAgentId={typeof selectedAgentId === "number" ? selectedAgentId : null}
                />
              </div>
            </div>
            <button
              onClick={() => setLeftOpen(v => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors shrink-0"
            >
              {leftOpen
                ? <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Users className="w-3 h-3 text-primary" />
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </div>}
            </button>
          </div>

          {/* Centre */}
          <div className="flex-1 flex flex-col items-center justify-end pb-3 sm:pb-4 gap-2 pointer-events-none min-w-0">
            <div className="pointer-events-auto">
              <FloorIndicator />
            </div>
            {gameState === "playing" && (
              <button
                onClick={() => { setGameState("lobby"); document.exitPointerLock?.(); }}
                className="pointer-events-auto px-3 py-1.5 rounded-full text-xs bg-black/50 backdrop-blur-sm border border-white/20 text-white/60 hover:text-white hover:bg-black/70 transition-all"
              >
                ← Lobby
              </button>
            )}
          </div>

          {/* Right panel */}
          <div className="flex items-start pt-3 pr-2 sm:pr-3 gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <button
              onClick={() => setRightOpen(v => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors shrink-0"
            >
              {rightOpen
                ? <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Rss className="w-3 h-3 text-primary" />
                    <ChevronLeft className="w-3 h-3 text-gray-500" />
                  </div>}
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${rightOpen ? "w-56 sm:w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100dvh - 110px)" }}
            >
              <div className="w-56 sm:w-64 h-full">
                <ActivityFeedHUD />
              </div>
            </div>
          </div>
        </div>

        {/* Selected agent panel — bottom centre, hidden on mobile when selected */}
        {selectedAgentId && typeof selectedAgentId === "number" && currentFloor === 1 && (
          <div className="w-full flex justify-center pb-2 sm:pb-3 px-2 pointer-events-auto shrink-0">
            <SelectedAgentHUD agentId={selectedAgentId} onClose={handleCloseSelected} />
          </div>
        )}
      </div>

      {/* Chat overlay */}
      {chatTarget && (
        <ChatOverlay
          agent={chatTarget}
          onClose={() => { setChatTarget(null); setSelectedAgentId(null); }}
        />
      )}

      <ElevatorUI />

      {/* Rotate device hint — shown on mobile portrait while playing (for iOS that ignores orientation lock) */}
      {isMobile && isPortrait && gameState === "playing" && !chatTarget && (
        <div
          className="fixed inset-0 z-[9000] flex flex-col items-center justify-center gap-4 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
        >
          <div style={{ fontSize: 56, animation: "spin90 1.2s ease-in-out infinite alternate" }}>📱</div>
          <div className="text-white font-bold text-base text-center px-6">Putar perangkat ke landscape</div>
          <div className="text-white/50 text-xs text-center px-8">Untuk pengalaman terbaik di mode 3D</div>
          <style>{`@keyframes spin90 { from { transform: rotate(0deg); } to { transform: rotate(90deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
