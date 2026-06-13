import { useState } from "react";
import { AgentScene } from "@/components/3d/AgentScene";
import { AgentListHUD } from "@/components/hud/AgentListHUD";
import { ActivityFeedHUD } from "@/components/hud/ActivityFeedHUD";
import { SelectedAgentHUD } from "@/components/hud/SelectedAgentHUD";

export default function Home() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  return (
    <div className="absolute inset-0 bg-background w-full h-full flex overflow-hidden">
      {/* 3D Scene underlay */}
      <div className="absolute inset-0 z-0">
        <AgentScene onSelectAgent={setSelectedAgentId} selectedAgentId={selectedAgentId} />
      </div>

      {/* HUD Overlays */}
      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col justify-between p-4">
        <div className="flex justify-between items-start flex-1 overflow-hidden">
          <div className="w-80 h-full pointer-events-auto flex flex-col">
            <AgentListHUD onSelectAgent={setSelectedAgentId} selectedAgentId={selectedAgentId} />
          </div>
          
          <div className="w-80 h-full pointer-events-auto flex flex-col">
            <ActivityFeedHUD />
          </div>
        </div>

        {selectedAgentId && (
          <div className="w-full flex justify-center mt-4 pointer-events-auto shrink-0">
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
