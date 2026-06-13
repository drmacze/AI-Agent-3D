import { useGetActivityFeed, getGetActivityFeedQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, PlayCircle, CheckCircle2, Navigation, Radio, Rss } from "lucide-react";
import { format } from "date-fns";

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  task_started:  { icon: <PlayCircle className="w-3.5 h-3.5" />,  color: "text-blue-600",  bg: "bg-blue-50 border-blue-100"  },
  task_completed:{ icon: <CheckCircle2 className="w-3.5 h-3.5" />,color: "text-green-600", bg: "bg-green-50 border-green-100" },
  chat:          { icon: <MessageSquare className="w-3.5 h-3.5" />,color: "text-violet-600",bg: "bg-violet-50 border-violet-100"},
  movement:      { icon: <Navigation className="w-3.5 h-3.5" />,  color: "text-amber-600", bg: "bg-amber-50 border-amber-100"  },
  status_change: { icon: <Radio className="w-3.5 h-3.5" />,       color: "text-gray-600",  bg: "bg-gray-50 border-gray-100"   },
  broadcast:     { icon: <Rss className="w-3.5 h-3.5" />,         color: "text-rose-600",  bg: "bg-rose-50 border-rose-100"   },
};

export function ActivityFeedHUD() {
  const { data: events } = useGetActivityFeed({
    query: { refetchInterval: 3000, queryKey: getGetActivityFeedQueryKey() },
  });

  return (
    <div
      className="flex flex-col h-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      data-testid="hud-activity-feed"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm text-gray-800">Activity</h2>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {!events?.length ? (
            <div className="text-center py-8 text-sm text-gray-400">No recent activity</div>
          ) : (
            events.map((event) => {
              const cfg = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG.status_change;
              return (
                <div
                  key={event.id}
                  className={`p-2.5 rounded-lg border text-xs ${cfg.bg}`}
                  data-testid={`event-${event.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 font-medium ${cfg.color}`}>
                      {cfg.icon}
                      <span>{event.agentName}</span>
                    </div>
                    <span className="text-gray-400 tabular-nums">
                      {format(new Date(event.timestamp), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
