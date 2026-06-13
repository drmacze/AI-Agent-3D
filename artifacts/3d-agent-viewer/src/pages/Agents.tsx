import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, CheckCircle, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Agents() {
  const { data: agents, isLoading } = useListAgents({
    query: { refetchInterval: 5000, queryKey: getListAgentsQueryKey() }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-muted text-muted-foreground border-muted';
      case 'working': return 'bg-primary/20 text-primary border-primary/50 animate-pulse';
      case 'chatting': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'moving': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-primary flex items-center gap-3">
            <BrainCircuit className="w-8 h-8" />
            AGENT ROSTER
          </h1>
          <p className="text-muted-foreground mt-2">Live status of all autonomous units.</p>
        </div>
        <div className="bg-card border border-border rounded-md px-4 py-2 flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="font-mono font-bold text-lg" data-testid="total-agents-count">
            {agents?.length || 0} UNITS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : !agents?.length ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card/30">
            No agents found in the system.
          </div>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id} className="bg-card border-border hover:border-primary/50 transition-colors group relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity" 
                style={{ backgroundColor: agent.color }} 
              />
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-mono flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color, boxShadow: `0 0 10px ${agent.color}` }} />
                  {agent.name}
                </CardTitle>
                <Badge variant="outline" className={`font-mono text-xs capitalize ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-mono text-foreground">{agent.role}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> Current Task</span>
                  </div>
                  <p className="text-sm font-mono truncate text-primary/90" title={agent.currentTask || "Idle"}>
                    {agent.currentTask || "Awaiting assignment..."}
                  </p>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                  <span className="font-mono text-foreground">{agent.completedTasks || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
