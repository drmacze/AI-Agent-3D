import { useGetAgent, useGetAgentMessages, getGetAgentQueryKey, getGetAgentMessagesQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MessageSquare, Briefcase, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SelectedAgentHUDProps {
  agentId: number;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  idle:      "bg-gray-100 text-gray-600",
  working:   "bg-blue-100 text-blue-700",
  chatting:  "bg-violet-100 text-violet-700",
  moving:    "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const MSG_TYPE_STYLES: Record<string, string> = {
  chat:        "bg-blue-50 border-blue-100",
  broadcast:   "bg-amber-50 border-amber-100",
  task_update: "bg-green-50 border-green-100",
  system:      "bg-gray-50 border-gray-100",
};

export function SelectedAgentHUD({ agentId, onClose }: SelectedAgentHUDProps) {
  const { data: agent } = useGetAgent(agentId, {
    query: { enabled: !!agentId, queryKey: getGetAgentQueryKey(agentId) },
  });

  const { data: messages } = useGetAgentMessages(agentId, {
    query: { enabled: !!agentId, refetchInterval: 3000, queryKey: getGetAgentMessagesQueryKey(agentId) },
  });

  if (!agent) return null;

  const statusStyle = STATUS_STYLES[agent.status] ?? STATUS_STYLES.idle;

  return (
    <div
      className="w-[620px] max-h-[300px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col"
      data-testid="hud-selected-agent"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: agent.color }}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{agent.name}</div>
            <div className="text-xs text-gray-500">{agent.role}</div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-1 ${statusStyle}`}>
            {agent.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
          data-testid="btn-close-hud"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Stats */}
        <div className="w-56 border-r border-gray-100 p-4 space-y-4 shrink-0 overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">
              <Briefcase className="w-3 h-3" /> Current Task
            </div>
            <p className="text-xs text-gray-700 leading-snug">
              {agent.currentTask ?? <span className="text-gray-400 italic">None</span>}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">
              <CheckCircle2 className="w-3 h-3" /> Tasks Done
            </div>
            <p className="text-sm font-bold text-gray-800">{agent.completedTasks}</p>
          </div>

          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Position</div>
            <p className="text-xs text-gray-600 font-mono">
              X: {agent.positionX.toFixed(1)}, Z: {agent.positionZ.toFixed(1)}
            </p>
          </div>

          {agent.interactingWithId && (
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1">Talking with</div>
              <p className="text-xs text-violet-700 font-medium">Agent #{agent.interactingWithId}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-2 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <MessageSquare className="w-3.5 h-3.5" /> Messages
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {!messages?.length ? (
                <p className="text-xs text-gray-400 text-center py-6">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-xs border rounded-lg p-2.5 ${MSG_TYPE_STYLES[msg.type] ?? "bg-gray-50 border-gray-100"}`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] text-gray-400">
                      <span className="font-medium uppercase">{msg.type}</span>
                      <span className="tabular-nums">{format(new Date(msg.timestamp), "HH:mm:ss")}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{msg.content}</p>
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
