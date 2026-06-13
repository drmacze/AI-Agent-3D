import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

interface AgentListHUDProps {
  onSelectAgent: (id: number) => void;
  selectedAgentId: number | null;
}

export function AgentListHUD({ onSelectAgent, selectedAgentId }: AgentListHUDProps) {
  const { data: agents, isLoading } = useListAgents({
    query: { refetchInterval: 3000, queryKey: getListAgentsQueryKey() }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-muted text-muted-foreground border-muted';
      case 'working': return 'bg-primary/20 text-primary border-primary/50';
      case 'chatting': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'moving': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden" data-testid="hud-agent-list">
      <div className="p-3 border-b border-border/50 bg-background/50">
        <h2 className="font-mono font-bold text-sm text-primary flex items-center gap-2">
          <Activity className="w-4 h-4" />
          ACTIVE AGENTS
        </h2>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-md border border-border/30 bg-background/30">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : !agents?.length ? (
            <div className="text-center py-8 text-sm text-muted-foreground font-mono">
              No agents online
            </div>
          ) : (
            agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full text-left p-3 rounded-md border transition-all ${
                  selectedAgentId === agent.id 
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]' 
                    : 'border-border/50 bg-background/50 hover:border-primary/50 hover:bg-background/80'
                }`}
                data-testid={`btn-select-agent-${agent.id}`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color, boxShadow: `0 0 5px ${agent.color}` }} />
                    <span className="font-mono font-bold text-sm text-foreground">{agent.name}</span>
                  </div>
                  <Badge variant="outline" className={`font-mono text-[10px] uppercase px-1.5 py-0 ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span className="font-mono opacity-70">{agent.role}</span>
                  <span className="font-mono truncate max-w-[120px] ml-2 text-primary/70" title={agent.currentTask || "Idle"}>
                    {agent.currentTask || "Idle"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
