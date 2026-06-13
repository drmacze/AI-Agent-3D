import { useState } from "react";
import { AgentScene } from "@/components/3d/AgentScene";
import { AgentListHUD } from "@/components/hud/AgentListHUD";
import { ActivityFeedHUD } from "@/components/hud/ActivityFeedHUD";
import { SelectedAgentHUD } from "@/components/hud/SelectedAgentHUD";
import { ChevronLeft, ChevronRight, Users, Rss } from "lucide-react";

export default function Home() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [leftOpen, setLeftOpen]   = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="absolute inset-0 bg-background w-full h-full flex overflow-hidden">
      {/* ── 3D Scene fills entire space ── */}
      <div className="absolute inset-0 z-0">
        <AgentScene onSelectAgent={setSelectedAgentId} selectedAgentId={selectedAgentId} />
      </div>

      {/* ── HUD overlay layer ── */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col">
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left panel (Agents) ── */}
          <div className="flex items-start pt-3 pl-3 gap-1.5 pointer-events-auto shrink-0">
            {/* Panel */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${leftOpen ? "w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              <div className="w-64 h-full">
                <AgentListHUD onSelectAgent={setSelectedAgentId} selectedAgentId={selectedAgentId} />
              </div>
            </div>

            {/* Toggle button */}
            <button
              onClick={() => setLeftOpen((v) => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors"
              title={leftOpen ? "Hide agents" : "Show agents"}
            >
              {leftOpen
                ? <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Users className="w-3 h-3 text-primary" />
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </div>
              }
            </button>
          </div>

          {/* ── Centre — pure 3D scene ── */}
          <div className="flex-1" />

          {/* ── Right panel (Activity) ── */}
          <div className="flex items-start pt-3 pr-3 gap-1.5 pointer-events-auto shrink-0">
            {/* Toggle button */}
            <button
              onClick={() => setRightOpen((v) => !v)}
              className="mt-1 flex items-center justify-center w-7 h-8 rounded-lg bg-white/85 backdrop-blur-sm border border-gray-200 shadow-md hover:bg-white transition-colors"
              title={rightOpen ? "Hide activity" : "Show activity"}
            >
              {rightOpen
                ? <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                : <div className="flex flex-col items-center gap-0.5">
                    <Rss className="w-3 h-3 text-primary" />
                    <ChevronLeft className="w-3 h-3 text-gray-500" />
                  </div>
              }
            </button>

            {/* Panel */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden h-full ${rightOpen ? "w-64 opacity-100" : "w-0 opacity-0"}`}
              style={{ maxHeight: "calc(100vh - 120px)" }}
            >
              <div className="w-64 h-full">
                <ActivityFeedHUD />
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected agent panel (bottom centre) ── */}
        {selectedAgentId && (
          <div className="w-full flex justify-center pb-3 pointer-events-auto shrink-0">
            <SelectedAgentHUD
              agentId={selectedAgentId}
              onClose={() => setSelectedAgentId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
