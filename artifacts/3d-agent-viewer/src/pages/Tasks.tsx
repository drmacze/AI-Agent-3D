import { useState } from "react";
import { useListTasks, useListAgents, useGetTask, getGetTaskQueryKey, getListTasksQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ListTodo, Clock, AlertTriangle, AlertCircle, Info, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  completed:   { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500",  label: "Completed"   },
  in_progress: { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   label: "In Progress" },
  failed:      { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    label: "Failed"      },
  pending:     { bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400",   label: "Pending"     },
};

const PRIORITY_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  critical: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-700",    bg: "bg-red-50 border-red-200"    },
  high:     { icon: <AlertCircle className="w-3.5 h-3.5" />,   color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  medium:   { icon: <Clock className="w-3.5 h-3.5" />,          color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"  },
  low:      { icon: <Info className="w-3.5 h-3.5" />,           color: "text-gray-500",   bg: "bg-gray-50 border-gray-200"    },
};

export default function Tasks() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useListTasks({
    query: { refetchInterval: 5000, queryKey: getListTasksQueryKey() },
  });
  const { data: agents } = useListAgents();

  const getAgentChip = (agentId: number | null | undefined) => {
    if (!agentId) return <span className="text-gray-400 text-xs italic">Unassigned</span>;
    const agent = agents?.find((a) => a.id === agentId);
    if (!agent) return <span className="text-gray-400 text-xs">Unknown</span>;
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agent.color }} />
        <span className="text-sm text-gray-700 font-medium">{agent.name}</span>
      </div>
    );
  };

  const summary = tasks
    ? {
        total: tasks.length,
        done: tasks.filter((t) => t.status === "completed").length,
        active: tasks.filter((t) => t.status === "in_progress").length,
        pending: tasks.filter((t) => t.status === "pending").length,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-primary" />
            Task Board
          </h1>
          <p className="text-gray-500 mt-1 text-sm">All agent tasks and their current status.</p>
        </div>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: "Total", value: summary.total, color: "bg-gray-100 text-gray-700" },
            { label: "In Progress", value: summary.active, color: "bg-blue-100 text-blue-700" },
            { label: "Pending", value: summary.pending, color: "bg-amber-100 text-amber-700" },
            { label: "Completed", value: summary.done, color: "bg-green-100 text-green-700" },
          ].map((pill) => (
            <div key={pill.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${pill.color}`}>
              {pill.label}: <span className="font-bold">{pill.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-gray-200 hover:bg-gray-50">
              <TableHead className="w-[280px] text-gray-600 font-semibold">Task</TableHead>
              <TableHead className="text-gray-600 font-semibold">Status</TableHead>
              <TableHead className="text-gray-600 font-semibold">Priority</TableHead>
              <TableHead className="text-gray-600 font-semibold">Assigned</TableHead>
              <TableHead className="w-[180px] text-gray-600 font-semibold">Progress</TableHead>
              <TableHead className="text-right text-gray-600 font-semibold">Created</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-100">
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-full rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              : !tasks?.length
              ? (
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                      No tasks in the system.
                    </TableCell>
                  </TableRow>
                )
              : tasks.map((task) => {
                  const st = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending;
                  const pr = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low;

                  return (
                    <TableRow
                      key={task.id}
                      className="border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTaskId(task.id)}
                      data-testid={`task-row-${task.id}`}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[260px] mt-0.5">{task.description}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${task.status === "in_progress" ? "animate-pulse" : ""}`} />
                          {st.label}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${pr.bg} ${pr.color}`}>
                          {pr.icon}
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      </TableCell>

                      <TableCell>{getAgentChip(task.assignedAgentId)}</TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Progress</span>
                            <span className={`font-medium ${task.progress === 100 ? "text-green-600" : "text-blue-600"}`}>
                              {task.progress ?? 0}%
                            </span>
                          </div>
                          <Progress value={task.progress ?? 0} className="h-1.5 bg-gray-100" />
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-xs text-gray-400 tabular-nums">
                        {task.createdAt ? format(new Date(task.createdAt), "MMM d, HH:mm") : "—"}
                      </TableCell>

                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      <TaskDetailsDialog
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        agents={agents ?? []}
      />
    </div>
  );
}

function TaskDetailsDialog({
  taskId,
  onClose,
  agents,
}: {
  taskId: number | null;
  onClose: () => void;
  agents: { id: number; name: string; color: string; role: string }[];
}) {
  const { data: task, isLoading } = useGetTask(taskId!, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId!) },
  });

  const st = STATUS_STYLES[task?.status ?? "pending"] ?? STATUS_STYLES.pending;
  const pr = PRIORITY_STYLES[task?.priority ?? "low"] ?? PRIORITY_STYLES.low;
  const assignedAgent = agents.find((a) => a.id === task?.assignedAgentId);

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-white border-gray-200" data-testid="task-details-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary" />
            Task Details
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Task #{task?.id ?? "..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !task ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {task.description ?? <span className="italic">No description provided.</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Status</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Priority</p>
                <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${pr.bg} ${pr.color}`}>
                  {pr.icon}
                  <span className="capitalize">{task.priority}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Assigned Agent</p>
                {assignedAgent ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: assignedAgent.color }}
                    >
                      {assignedAgent.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{assignedAgent.name}</span>
                    <span className="text-xs text-gray-400">{assignedAgent.role}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Unassigned</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={task.progress ?? 0} className="flex-1 h-2 bg-gray-200" />
                  <span className={`text-sm font-bold tabular-nums ${task.progress === 100 ? "text-green-600" : "text-blue-600"}`}>
                    {task.progress ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Created: {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy HH:mm") : "Unknown"}
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Done: {format(new Date(task.completedAt), "MMM d, yyyy HH:mm")}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
