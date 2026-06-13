import { useState } from "react";
import { useListTasks, useListAgents, useGetTask, getGetTaskQueryKey, getListTasksQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ListTodo, Clock, AlertTriangle, AlertCircle, Info, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Tasks() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useListTasks({
    query: { refetchInterval: 5000, queryKey: getListTasksQueryKey() }
  });
  const { data: agents } = useListAgents();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 font-mono">COMPLETED</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 font-mono animate-pulse">IN PROGRESS</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50 font-mono">FAILED</Badge>;
      default: return <Badge variant="outline" className="bg-muted text-muted-foreground font-mono">PENDING</Badge>;
    }
  };

  const getAgentName = (agentId: number | null) => {
    if (!agentId) return <span className="text-muted-foreground italic">Unassigned</span>;
    const agent = agents?.find(a => a.id === agentId);
    if (!agent) return <span className="text-muted-foreground">Unknown ({agentId})</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
        <span className="font-mono text-sm">{agent.name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-primary flex items-center gap-3">
            <ListTodo className="w-8 h-8" />
            TASK DIRECTORY
          </h1>
          <p className="text-muted-foreground mt-2">Global task queue and completion status.</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[300px]">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead className="w-[200px]">Progress</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasksLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-2 w-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !tasks?.length ? (
              <TableRow className="border-border hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No tasks currently in the system.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className="border-border hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTaskId(task.id)}
                  data-testid={`task-row-${task.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="text-foreground flex items-center gap-2">
                        {task.title}
                        <Info className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-sm capitalize">
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </div>
                  </TableCell>
                  <TableCell>{getAgentName(task.assignedAgentId)}</TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">Completion</span>
                        <span className={task.progress === 100 ? "text-green-400" : "text-primary"}>
                          {task.progress || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={task.progress || 0} 
                        className="h-1.5 bg-muted"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-muted-foreground">
                    {task.createdAt ? format(new Date(task.createdAt), "MMM d, HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <TaskDetailsDialog 
        taskId={selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
        agents={agents || []}
      />
    </div>
  );
}

function TaskDetailsDialog({ taskId, onClose, agents }: { taskId: number | null, onClose: () => void, agents: any[] }) {
  const { data: task, isLoading } = useGetTask(taskId!, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId!) }
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 font-mono">COMPLETED</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 font-mono animate-pulse">IN PROGRESS</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/50 font-mono">FAILED</Badge>;
      default: return <Badge variant="outline" className="bg-muted text-muted-foreground font-mono">PENDING</Badge>;
    }
  };

  const assignedAgent = agents.find(a => a.id === task?.assignedAgentId);

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] border-primary/30 bg-card/95 backdrop-blur-xl" data-testid="task-details-dialog">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-primary flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            TASK DETAILS
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono text-xs">
            ID: {task?.id || '...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !task ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">{task.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-md bg-background/50 border border-border/50">
                <span className="text-xs text-muted-foreground font-mono uppercase">Status</span>
                <div>{getStatusBadge(task.status)}</div>
              </div>
              
              <div className="space-y-1.5 p-3 rounded-md bg-background/50 border border-border/50">
                <span className="text-xs text-muted-foreground font-mono uppercase">Priority</span>
                <div className="flex items-center gap-2 font-mono text-sm capitalize">
                  {getPriorityIcon(task.priority)}
                  {task.priority}
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-md bg-background/50 border border-border/50">
                <span className="text-xs text-muted-foreground font-mono uppercase">Assigned Agent</span>
                <div className="flex items-center gap-2">
                  {assignedAgent ? (
                    <>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: assignedAgent.color }} />
                      <span className="font-mono text-sm">{assignedAgent.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-md bg-background/50 border border-border/50">
                <span className="text-xs text-muted-foreground font-mono uppercase">Progress</span>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={task.progress || 0} 
                    className="flex-1 h-2 bg-muted"
                  />
                  <span className="font-mono text-sm text-primary">{task.progress || 0}%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-4 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Created: {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy HH:mm") : "Unknown"}
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-1.5 text-green-500/70">
                  <Calendar className="w-3 h-3" />
                  Completed: {format(new Date(task.completedAt), "MMM d, yyyy HH:mm")}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
