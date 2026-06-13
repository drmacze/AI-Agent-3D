import { useState, useEffect } from "react";
import { useFloor, FLOOR_THEMES, type FloorId } from "@/context/FloorContext";
import { X, ArrowUp, ArrowDown } from "lucide-react";

function ElevatorRidePanel() {
  const { currentFloor, ridingFrom, ridingTo } = useFloor();
  const from = ridingFrom ?? currentFloor;
  const to = ridingTo ?? currentFloor;
  const goingUp = to > from;
  const theme = FLOOR_THEMES[to];

  const [displayFloor, setDisplayFloor] = useState<number>(from);
  const [phase, setPhase] = useState<"closing" | "riding" | "opening">("closing");

  useEffect(() => {
    setDisplayFloor(from);
    setPhase("closing");

    const t1 = setTimeout(() => { setPhase("riding"); }, 400);

    // Animate floor number counting
    const steps = Math.abs(to - from);
    if (steps > 0) {
      const stepMs = 1000 / steps;
      for (let i = 1; i <= steps; i++) {
        const f = from + (goingUp ? i : -i);
        setTimeout(() => setDisplayFloor(f as FloorId), 400 + i * stepMs);
      }
    }

    const t2 = setTimeout(() => { setPhase("opening"); }, 1700);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [from, to, goingUp]);

  return (
    <div className="flex flex-col items-center gap-4 text-white w-full max-w-xs mx-auto px-4">
      {/* Elevator shaft visual */}
      <div
        className="w-full rounded-2xl overflow-hidden border border-white/20"
        style={{ background: "rgba(10,10,25,0.9)", maxWidth: 280 }}
      >
        {/* Door animation top */}
        <div
          className="h-1.5 transition-all duration-500"
          style={{
            background: "linear-gradient(90deg,#b8860b,#ffd700,#b8860b)",
            opacity: phase === "closing" ? 1 : phase === "opening" ? 0.4 : 0.7,
          }}
        />

        {/* Door panels */}
        <div className="relative flex overflow-hidden" style={{ height: 120 }}>
          <div
            className="absolute inset-y-0 left-0 transition-all duration-500 flex items-center justify-end pr-2"
            style={{
              width: phase === "riding" ? "50%" : phase === "closing" ? "50%" : "5%",
              background: "linear-gradient(135deg,rgba(30,30,50,0.95),rgba(20,20,40,0.98))",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {phase !== "opening" && <div className="w-0.5 h-16 rounded bg-white/10" />}
          </div>
          <div
            className="absolute inset-y-0 right-0 transition-all duration-500 flex items-center justify-start pl-2"
            style={{
              width: phase === "riding" ? "50%" : phase === "closing" ? "50%" : "5%",
              background: "linear-gradient(135deg,rgba(20,20,40,0.98),rgba(30,30,50,0.95))",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {phase !== "opening" && <div className="w-0.5 h-16 rounded bg-white/10" />}
          </div>

          {/* Center display — visible when opening */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
            style={{ opacity: phase === "opening" ? 1 : 0 }}
          >
            <div className="text-5xl mb-1">{theme.emoji}</div>
            <div className="text-white font-bold text-sm">{theme.name}</div>
            <div className="text-white/40 text-xs">{theme.department}</div>
          </div>
        </div>

        {/* Door animation bottom */}
        <div
          className="h-1.5 transition-all duration-500"
          style={{
            background: "linear-gradient(90deg,#b8860b,#ffd700,#b8860b)",
            opacity: phase === "closing" ? 1 : phase === "opening" ? 0.4 : 0.7,
          }}
        />
      </div>

      {/* Floor counter display */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-white/15"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-1.5">
          {goingUp
            ? <ArrowUp className="w-4 h-4 text-white/60" />
            : <ArrowDown className="w-4 h-4 text-white/60" />}
        </div>
        <div className="text-center">
          <div
            className="font-black tabular-nums transition-all duration-200"
            style={{
              fontSize: 36,
              color: FLOOR_THEMES[displayFloor as FloorId]?.accent ?? "#fff",
              textShadow: `0 0 20px ${FLOOR_THEMES[displayFloor as FloorId]?.accent ?? "#fff"}60`,
              lineHeight: 1,
            }}
          >
            {displayFloor}
          </div>
          <div className="text-white/40 text-[10px] mt-0.5 uppercase tracking-widest">Floor</div>
        </div>
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/30"
              style={{ animationDelay: `${i * 0.15}s`, animation: "pulse 0.8s ease-in-out infinite" }}
            />
          ))}
        </div>
      </div>

      <p className="text-white/50 text-xs text-center">
        {phase === "closing" ? "Pintu menutup..." : phase === "riding" ? `Menuju lantai ${to}...` : "Pintu membuka..."}
      </p>
    </div>
  );
}

export function ElevatorUI() {
  const { currentFloor, setFloor, isElevatorOpen, closeElevator, isRiding } = useFloor();

  if (!isElevatorOpen && !isRiding) return null;

  const floors: FloorId[] = [5, 4, 3, 2, 1];

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
    >
      {isRiding ? (
        <ElevatorRidePanel />
      ) : (
        <div
          className="w-full rounded-3xl shadow-2xl overflow-hidden border border-white/10"
          style={{
            maxWidth: 320,
            background: "linear-gradient(180deg,#1e293b,#0f172a)",
          }}
        >
          {/* Gold trim top */}
          <div className="h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700" />

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛗</span>
              <div>
                <p className="text-white font-bold text-sm">DLavie Elevator</p>
                <p className="text-white/40 text-xs">Lantai saat ini: {currentFloor}</p>
              </div>
            </div>
            <button
              onClick={closeElevator}
              className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Floor buttons */}
          <div className="p-3 space-y-1.5">
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
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{
                      background: isCurrent ? "rgba(250,204,21,0.2)" : `${theme.accent}25`,
                      border: `1.5px solid ${isCurrent ? "#facc15" : theme.accent}55`,
                    }}
                  >
                    <span style={{ color: isCurrent ? "#facc15" : theme.accent }}>{floor}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{theme.emoji}</span>
                      <span className={`text-sm font-semibold ${isCurrent ? "text-yellow-400" : "text-white"}`}>
                        {theme.name}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 truncate">{theme.department}</p>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20 shrink-0">
                      SINI
                    </span>
                  ) : (
                    floor > currentFloor
                      ? <ArrowUp className="w-3.5 h-3.5 text-white/25 shrink-0" />
                      : <ArrowDown className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Gold trim bottom */}
          <div className="h-2 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700" />
        </div>
      )}
    </div>
  );
}
