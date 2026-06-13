import { useFloor, FLOOR_THEMES, type FloorId } from "@/context/FloorContext";
import { X, ArrowUp, ArrowDown } from "lucide-react";

export function ElevatorUI() {
  const { currentFloor, setFloor, isElevatorOpen, closeElevator, isRiding } = useFloor();

  if (!isElevatorOpen && !isRiding) return null;

  const floors: FloorId[] = [5, 4, 3, 2, 1];

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      {isRiding ? (
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
            <div className="text-4xl animate-bounce">🛗</div>
          </div>
          <p className="text-lg font-bold">Riding elevator...</p>
          <p className="text-sm text-white/60">Going to Floor {currentFloor}</p>
          <div className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-72 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Door frame top */}
          <div className="h-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛗</span>
              <div>
                <p className="text-white font-bold text-sm">DLavie Elevator</p>
                <p className="text-white/40 text-xs">Currently: Floor {currentFloor}</p>
              </div>
            </div>
            <button onClick={closeElevator} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Floor buttons */}
          <div className="p-4 space-y-2">
            {floors.map(floor => {
              const theme = FLOOR_THEMES[floor];
              const isCurrent = floor === currentFloor;
              return (
                <button
                  key={floor}
                  onClick={() => setFloor(floor)}
                  disabled={isCurrent}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                    isCurrent
                      ? "border-yellow-400/50 bg-yellow-400/10 cursor-default"
                      : "border-white/10 bg-white/5 hover:bg-white/12 hover:border-white/20 active:scale-95"
                  }`}
                >
                  {/* Floor number */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{ background: isCurrent ? "rgba(250,204,21,0.25)" : `${theme.accent}33`, border: `1.5px solid ${isCurrent ? "#facc15" : theme.accent}66` }}
                  >
                    {isCurrent ? (
                      <span className="text-yellow-400">{floor}</span>
                    ) : floor > currentFloor ? (
                      <span style={{ color: theme.accent }}>{floor}</span>
                    ) : (
                      <span style={{ color: theme.accent }}>{floor}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{theme.emoji}</span>
                      <span className={`text-sm font-semibold ${isCurrent ? "text-yellow-400" : "text-white"}`}>{theme.name}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{theme.department}</p>
                  </div>

                  {isCurrent && (
                    <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">HERE</span>
                  )}
                  {!isCurrent && (
                    floor > currentFloor
                      ? <ArrowUp className="w-4 h-4 text-white/30" />
                      : <ArrowDown className="w-4 h-4 text-white/30" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Door frame bottom */}
          <div className="h-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
        </div>
      )}
    </div>
  );
}
