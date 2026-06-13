import { useGetActivityFeed, getGetActivityFeedQueryKey } from "@workspace/api-client-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, MessageSquare, PlayCircle, CheckCircle, Navigation, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function ActivityFeedHUD() {
  const { data: events } = useGetActivityFeed({
    query: { refetchInterval: 3000, queryKey: getGetActivityFeedQueryKey() }
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task_started': return <PlayCircle className="w-3 h-3 text-primary" />;
      case 'task_completed': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'chat': return <MessageSquare className="w-3 h-3 text-purple-400" />;
      case 'movement': return <Navigation className="w-3 h-3 text-orange-400" />;
      case 'status_change': return <AlertCircle className="w-3 h-3 text-blue-400" />;
      default: return <Terminal className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task_started': return 'text-primary/90';
      case 'task_completed': return 'text-green-400/90';
      case 'chat': return 'text-purple-400/90';
      case 'movement': return 'text-orange-400/90';
      case 'status_change': return 'text-blue-400/90';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden" data-testid="hud-activity-feed">
      <div className="p-3 border-b border-border/50 bg-background/50 flex items-center justify-between">
        <h2 className="font-mono font-bold text-sm text-primary flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          SYSTEM LOG
        </h2>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {!events?.length ? (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono">
              Awaiting system events...
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="font-mono text-xs border-l-2 border-border/50 pl-2 py-0.5" data-testid={`event-${event.id}`}>
                <div className="flex items-center justify-between mb-1 opacity-60">
                  <span className="flex items-center gap-1.5">
                    {getEventIcon(event.eventType)}
                    <span>{event.agentName}</span>
                  </span>
                  <span>{format(new Date(event.timestamp), "HH:mm:ss")}</span>
                </div>
                <div className={`leading-relaxed ${getEventColor(event.eventType)}`}>
                  {event.description}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
