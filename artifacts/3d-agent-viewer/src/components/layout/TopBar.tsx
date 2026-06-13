import { Link, useLocation } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Activity, Users, CheckCircle, LayoutDashboard, ListTodo } from "lucide-react";

export function TopBar() {
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 5000, queryKey: getGetDashboardSummaryQueryKey() }
  });
  const [location] = useLocation();

  return (
    <header className="h-14 border-b border-primary/20 bg-background/95 backdrop-blur z-50 flex items-center justify-between px-4 sticky top-0">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="font-bold tracking-widest text-lg">MISSION CONTROL</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-mono ml-4">
          <Link href="/" className={`hover:text-primary transition-colors flex items-center gap-2 ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutDashboard className="w-4 h-4" />
            Viewer
          </Link>
          <Link href="/agents" className={`hover:text-primary transition-colors flex items-center gap-2 ${location === '/agents' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Users className="w-4 h-4" />
            Roster
          </Link>
          <Link href="/tasks" className={`hover:text-primary transition-colors flex items-center gap-2 ${location === '/tasks' ? 'text-primary' : 'text-muted-foreground'}`}>
            <ListTodo className="w-4 h-4" />
            Tasks
          </Link>
        </nav>
      </div>

      {summary && (
        <div className="flex items-center gap-6 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span data-testid="stat-active-agents">ACTIVE: {summary.activeAgents}/{summary.totalAgents}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span data-testid="stat-completed-tasks">COMPLETED: {summary.completedTasks}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <span data-testid="stat-pending-tasks">PENDING: {summary.pendingTasks}</span>
          </div>
        </div>
      )}
    </header>
  );
}
