import { Link, useLocation } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Users, CheckCircle2, Clock, LayoutDashboard, ListTodo, Building2, Settings } from "lucide-react";
import { useGameTime } from "@/context/GameTimeContext";
import { useSettings } from "@/context/SettingsContext";

export function TopBar() {
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 5000, queryKey: getGetDashboardSummaryQueryKey() },
  });
  const [location] = useLocation();
  const gameTime = useGameTime();
  const { openSettings, hasApiKey } = useSettings();

  return (
    <header className="h-12 border-b border-border bg-white/95 backdrop-blur-sm z-50 flex items-center justify-between px-4 sticky top-0 shadow-sm">
      {/* Left — brand + nav */}
      <div className="flex items-center gap-5 min-w-0">
        <Link href="/" className="flex items-center gap-2 text-primary font-semibold text-sm hover:text-primary/80 transition-colors shrink-0">
          <Building2 className="w-4 h-4" />
          <span className="tracking-tight hidden sm:inline">DLavie OS</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-xs">
          <Link
            href="/"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              location === "/" ? "bg-primary/10 text-primary font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Office</span>
          </Link>
          <Link
            href="/agents"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              location === "/agents" ? "bg-primary/10 text-primary font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agents</span>
          </Link>
          <Link
            href="/tasks"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              location === "/tasks" ? "bg-primary/10 text-primary font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tasks</span>
          </Link>
        </nav>
      </div>

      {/* Centre — game clock */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 select-none">
        <span className="text-base leading-none">{gameTime.phaseEmoji}</span>
        <span className="font-mono text-sm font-semibold text-gray-800 tabular-nums">
          {gameTime.timeString}
        </span>
        <span className="text-[10px] font-medium text-gray-400 capitalize hidden xs:inline">
          {gameTime.phase}
        </span>
      </div>

      {/* Right — stats + settings */}
      <div className="flex items-center gap-3 shrink-0">
        {summary && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-gray-700">{summary.activeAgents}</span>
              <span className="text-gray-400 hidden sm:inline">/ {summary.totalAgents}</span>
            </div>
            <div className="items-center gap-1 hidden sm:flex">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span>{summary.completedTasks}</span>
            </div>
            <div className="items-center gap-1 hidden sm:flex">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{summary.inProgressTasks}</span>
            </div>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={openSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-100 ${
            hasApiKey ? "text-green-600" : "text-amber-600 bg-amber-50 hover:bg-amber-100"
          }`}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{hasApiKey ? "API ✓" : "Set API Key"}</span>
        </button>
      </div>
    </header>
  );
}
