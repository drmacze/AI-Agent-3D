import { useGetAgent, useGetAgentMessages, getGetAgentQueryKey, getGetAgentMessagesQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, MessageSquare, Briefcase, Hash, RadioReceiver } from "lucide-react";
import { format } from "date-fns";

interface SelectedAgentHUDProps {
  agentId: number;
  onClose: () => void;
}

export function SelectedAgentHUD({ agentId, onClose }: SelectedAgentHUDProps) {
  const { data: agent } = useGetAgent(agentId, {
    query: { enabled: !!agentId, queryKey: getGetAgentQueryKey(agentId) }
  });

  const { data: messages } = useGetAgentMessages(agentId, {
    query: { enabled: !!agentId, refetchInterval: 3000, queryKey: getGetAgentMessagesQueryKey(agentId) }
  });

  if (!agent) return null;

  return (
    <div className="w-[600px] bg-card/90 backdrop-blur-xl border border-primary/30 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.1)] overflow-hidden flex flex-col max-h-[300px]" data-testid="hud-selected-agent">
      <div className="p-2.5 border-b border-primary/20 bg-background/60 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color, boxShadow: `0 0 10px ${agent.color}` }} />
          <h3 className="font-mono font-bold text-foreground text-sm">{agent.name}</h3>
          <Badge variant="outline" className="font-mono text-[10px] h-5 bg-background/50">
            {agent.role}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] h-5 border-primary/50 text-primary">
            {agent.status}
          </Badge>
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          data-testid="btn-close-hud"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Stats Column */}
        <div className="w-1/3 border-r border-border/50 p-3 bg-background/30 flex flex-col gap-3 shrink-0">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 uppercase">
              <Briefcase className="w-3 h-3" /> Current Task
            </div>
            <div className="text-xs font-mono text-primary truncate" title={agent.currentTask || "None"}>
              {agent.currentTask || "None"}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 uppercase">
              <Hash className="w-3 h-3" /> Position
            </div>
            <div className="text-xs font-mono text-foreground">
              X: {agent.positionX.toFixed(1)} | Z: {agent.positionZ.toFixed(1)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 uppercase">
              <RadioReceiver className="w-3 h-3" /> Comms Target
            </div>
            <div className="text-xs font-mono text-foreground">
              {agent.interactingWithId ? `Agent ID: ${agent.interactingWithId}` : "None"}
            </div>
          </div>
        </div>

        {/* Messages Column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-1.5 bg-background/50 border-b border-border/30 shrink-0">
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 uppercase">
              <MessageSquare className="w-3 h-3" /> Comm Log
            </span>
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2 pr-2">
              {!messages?.length ? (
                <div className="text-xs text-muted-foreground font-mono text-center py-4 opacity-50">
                  No communications logged.
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="text-xs font-mono bg-background/40 border border-border/30 rounded p-2">
                    <div className="flex justify-between items-center mb-1 text-[10px] opacity-60">
                      <span>{msg.type}</span>
                      <span>{format(new Date(msg.timestamp), "HH:mm:ss")}</span>
                    </div>
                    <div className="text-foreground break-words">{msg.content}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
