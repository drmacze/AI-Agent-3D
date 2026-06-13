import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface AgentListHUDProps {
  onSelectAgent: (id: number) => void;
  selectedAgentId: number | null;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  idle:      { dot: "bg-gray-400",  label: "Idle",       bg: "bg-gray-100",   text: "text-gray-600"  },
  working:   { dot: "bg-blue-500",  label: "Working",    bg: "bg-blue-50",    text: "text-blue-700"  },
  chatting:  { dot: "bg-violet-500",label: "Chatting",   bg: "bg-violet-50",  text: "text-violet-700"},
  moving:    { dot: "bg-amber-500", label: "Moving",     bg: "bg-amber-50",   text: "text-amber-700" },
  completed: { dot: "bg-green-500", label: "Done",       bg: "bg-green-50",   text: "text-green-700" },
};

const ROLE_COLORS: Record<string, string> = {
  Researcher: "bg-indigo-100 text-indigo-700",
  Planner:    "bg-sky-100 text-sky-700",
  Coder:      "bg-emerald-100 text-emerald-700",
  Reviewer:   "bg-orange-100 text-orange-700",
};

export function AgentListHUD({ onSelectAgent, selectedAgentId }: AgentListHUDProps) {
  const { data: agents, isLoading } = useListAgents({
    query: { refetchInterval: 3000, queryKey: getListAgentsQueryKey() },
  });

  return (
    <div
      className="flex flex-col h-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      data-testid="hud-agent-list"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-sm text-gray-800">Agents</h2>
        {agents && (
          <span className="ml-auto text-xs text-gray-400 font-medium">{agents.length} total</span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-14" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : !agents?.length
            ? (
                <div className="text-center py-8 text-sm text-gray-400">No agents online</div>
              )
            : agents.map((agent) => {
                const st = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
                const roleClass = ROLE_COLORS[agent.role] ?? "bg-gray-100 text-gray-700";
                const isSelected = selectedAgentId === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? "border-primary bg-blue-50 ring-1 ring-primary/30"
                        : "border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200"
                    }`}
                    data-testid={`btn-select-agent-${agent.id}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${st.dot} ${
                            agent.status === "working" ? "animate-pulse" : ""
                          }`}
                        />
                        <span className="font-semibold text-sm text-gray-900">{agent.name}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleClass}`}>
                        {agent.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      {agent.currentTask && (
                        <span className="text-[11px] text-gray-500 truncate max-w-[130px] ml-2" title={agent.currentTask}>
                          {agent.currentTask}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>
      </ScrollArea>
    </div>
  );
}
