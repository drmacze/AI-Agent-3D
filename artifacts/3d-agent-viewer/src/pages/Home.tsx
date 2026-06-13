import { useState, useCallback, useEffect } from "react";
import { FloorScene } from "@/components/3d/FloorScene";
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

export default function Home() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | string | null>(null);
  const [chatTarget, setChatTarget] = useState<ChatTarget>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [nearNpcName, setNearNpcName] = useState<string | null>(null);
  const [nearNpcData, setNearNpcData] = useState<unknown>(null);
  const { currentFloor } = useFloor();
  const { gameState, setGameState } = useGameStore();

  // Auto-collapse panels when entering FPS mode
  useEffect(() => {
    if (gameState === 'playing') {
      setLeftOpen(false);
      setRightOpen(false);
    } else {
      setLeftOpen(true);
      setRightOpen(true);
    }
  }, [gameState]);

  const handleSelectAgent = useCallback((id: number | string) => {
    setSelectedAgentId(id);
  }, []);

  const handleChatAgent = useCallback((agent: unknown) => {
    setChatTarget(agent as ChatTarget);
  }, []);

  const handleCloseSelected = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const handleNearNpc = useCallback((name: string | null, agentData?: unknown) => {
    setNearNpcName(name);
    setNearNpcData(agentData ?? null);
  }, []);

  const handleInteract = useCallback(() => {
    if (nearNpcData) {
      setChatTarget(nearNpcData as ChatTarget);
    }
  }, [nearNpcData]);

  // E key to interact with nearby NPC
  useEffect(() => {
    if (gameState !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && nearNpcData) handleInteract();
      if (e.code === 'Escape') {
        document.exitPointerLock?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, nearNpcData, handleInteract]);

  return (
    <div className="absolute inset-0 bg-background w-full h-full flex overflow-hidden">
      {/* ── 3D Scene fills entire space ── */}
      <div className="absolute inset-0 z-0">
        <FloorScene
          onSelectAgent={handleSelectAgent}
          selectedAgentId={selectedAgentId}
          onChatAgent={handleChatAgent}
          onNearNpc={handleNearNpc}
        />
      </div>

      {/* ── Lobby screen overlay ── */}
      {gameState === 'lobby' && <LobbyScreen />}

      {/* ── In-game HUD (crosshair, interact prompt, hints) ── */}
      {gameState === 'playing' && (
        <InGameHUD nearNpcName={nearNpcName} onInteract={handleInteract} />
      )}

      {/* ── HUD overlay layer (only visible when playing) ── */}
      <div className={`relative z-10 w-full h-full pointer-events-none flex flex-col transition-opacity duration-300 ${gameState === 'lobby' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left panel ── */}
          <div className="flex items-start pt-3 pl-3 gap-1.5 pointer-events-auto shrink-0">
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${leftOpen ? "w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100vh - 120px)" }}>
              <div className="w-64 h-full">
                <AgentListHUD
                  onSelectAgent={(id) => { handleSelectAgent(id); }}
                  selectedAgentId={typeof selectedAgentId === "number" ? selectedAgentId : null}
                />
              </div>
            </div>
            <button
              onClick={() => setLeftOpen(v => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors">
              {leftOpen
                ? <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Users className="w-3 h-3 text-primary" />
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </div>}
            </button>
          </div>

          {/* ── Centre ── */}
          <div className="flex-1 flex flex-col items-center justify-end pb-4 gap-2 pointer-events-none">
            <div className="pointer-events-auto">
              <FloorIndicator />
            </div>
            {/* Back to lobby button */}
            {gameState === 'playing' && (
              <button
                onClick={() => { setGameState('lobby'); document.exitPointerLock?.(); }}
                className="pointer-events-auto px-4 py-1.5 rounded-full text-xs bg-black/50 backdrop-blur-sm border border-white/20 text-white/60 hover:text-white hover:bg-black/70 transition-all">
                ← Lobby
              </button>
            )}
          </div>

          {/* ── Right panel ── */}
          <div className="flex items-start pt-3 pr-3 gap-1.5 pointer-events-auto shrink-0">
            <button
              onClick={() => setRightOpen(v => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors">
              {rightOpen
                ? <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Rss className="w-3 h-3 text-primary" />
                    <ChevronLeft className="w-3 h-3 text-gray-500" />
                  </div>}
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${rightOpen ? "w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100vh - 120px)" }}>
              <div className="w-64 h-full">
                <ActivityFeedHUD />
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected agent panel (bottom centre) ── */}
        {selectedAgentId && typeof selectedAgentId === "number" && currentFloor === 1 && (
          <div className="w-full flex justify-center pb-3 pointer-events-auto shrink-0">
            <SelectedAgentHUD agentId={selectedAgentId} onClose={handleCloseSelected} />
          </div>
        )}
      </div>

      {/* ── Chat overlay (AI conversation) ── */}
      {chatTarget && (
        <ChatOverlay
          agent={chatTarget}
          onClose={() => { setChatTarget(null); setSelectedAgentId(null); }}
        />
      )}

      {/* ── Elevator UI ── */}
      <ElevatorUI />
    </div>
  );
}
