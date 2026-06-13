import { Link, useLocation } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Users, CheckCircle2, Clock, LayoutDashboard, ListTodo, Building2 } from "lucide-react";

export function TopBar() {
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 5000, queryKey: getGetDashboardSummaryQueryKey() },
  });
  const [location] = useLocation();

  return (
    <header className="h-14 border-b border-border bg-white z-50 flex items-center justify-between px-6 sticky top-0 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 text-primary font-semibold text-base hover:text-primary/80 transition-colors">
          <Building2 className="w-5 h-5" />
          <span className="tracking-tight">DLavie OS Office</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location === "/" ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Office View
          </Link>
          <Link
            href="/agents"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location === "/agents" ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            Agents
          </Link>
          <Link
            href="/tasks"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location === "/tasks" ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Tasks
          </Link>
        </nav>
      </div>

      {summary && (
        <div className="flex items-center gap-5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
            <span data-testid="stat-active-agents" className="font-medium">
              {summary.activeAgents} active
            </span>
            <span className="text-gray-400">/ {summary.totalAgents} agents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span data-testid="stat-completed-tasks">{summary.completedTasks} done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span data-testid="stat-pending-tasks">{summary.inProgressTasks} in progress</span>
          </div>
        </div>
      )}
    </header>
  );
}
