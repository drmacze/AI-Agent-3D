import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, Briefcase } from "lucide-react";

const STATUS_CONFIG: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  idle:      { dot: "bg-gray-400",   bg: "bg-gray-100",    text: "text-gray-600",   label: "Idle"      },
  working:   { dot: "bg-blue-500",   bg: "bg-blue-50",     text: "text-blue-700",   label: "Working"   },
  chatting:  { dot: "bg-violet-500", bg: "bg-violet-50",   text: "text-violet-700", label: "Chatting"  },
  moving:    { dot: "bg-amber-500",  bg: "bg-amber-50",    text: "text-amber-700",  label: "Moving"    },
  completed: { dot: "bg-green-500",  bg: "bg-green-50",    text: "text-green-700",  label: "Completed" },
};

const ROLE_STYLES: Record<string, { bg: string; text: string }> = {
  Researcher: { bg: "bg-indigo-100", text: "text-indigo-700" },
  Planner:    { bg: "bg-sky-100",    text: "text-sky-700"    },
  Coder:      { bg: "bg-emerald-100",text: "text-emerald-700"},
  Reviewer:   { bg: "bg-orange-100", text: "text-orange-700" },
};

export default function Agents() {
  const { data: agents, isLoading } = useListAgents({
    query: { refetchInterval: 5000, queryKey: getListAgentsQueryKey() },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" />
            Agent Roster
          </h1>
          <p className="text-gray-500 mt-1 text-sm">All AI agents currently active in the office.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700" data-testid="total-agents-count">
            {agents?.length ?? 0} agents
          </span>
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          : !agents?.length
          ? (
              <div className="col-span-full py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-white">
                No agents found.
              </div>
            )
          : agents.map((agent) => {
              const st = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle;
              const role = ROLE_STYLES[agent.role] ?? { bg: "bg-gray-100", text: "text-gray-700" };

              return (
                <div
                  key={agent.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-5 flex flex-col gap-4"
                  data-testid={`card-agent-${agent.id}`}
                >
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{agent.name}</span>
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${st.dot} ${
                            agent.status === "working" ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${role.bg} ${role.text}`}>
                        {agent.role}
                      </span>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full shrink-0 ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="text-xs">Current task</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-semibold text-gray-700">{agent.completedTasks ?? 0} done</span>
                    </div>
                  </div>

                  <p
                    className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 min-h-[2rem] leading-relaxed"
                    title={agent.currentTask ?? ""}
                  >
                    {agent.currentTask ?? <span className="text-gray-400 italic">Awaiting assignment</span>}
                  </p>
                </div>
              );
            })}
      </div>
    </div>
  );
}
