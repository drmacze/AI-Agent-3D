import { useFloor, FLOOR_THEMES } from "@/context/FloorContext";

export function FloorIndicator() {
  const { currentFloor, openElevator, isRiding } = useFloor();
  const theme = FLOOR_THEMES[currentFloor];

  return (
    <button
      onClick={openElevator}
      disabled={isRiding}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm transition-all active:scale-95 disabled:opacity-60"
      style={{
        background: `linear-gradient(135deg, ${theme.color}ee, ${theme.color}cc)`,
        borderColor: `${theme.accent}40`,
      }}
    >
      {/* Floor number */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-lg"
        style={{ background: `${theme.accent}30`, color: theme.accent, border: `1.5px solid ${theme.accent}60` }}
      >
        {currentFloor}
      </div>

      <div className="flex flex-col items-start">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{theme.emoji}</span>
          <span className="text-white font-bold text-sm leading-none">{theme.name}</span>
        </div>
        <span className="text-white/50 text-[10px] mt-0.5">Tap to use elevator 🛗</span>
      </div>

      {/* Signal dots */}
      <div className="flex gap-1 ml-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: i <= currentFloor ? theme.accent : `${theme.accent}30`,
              opacity: i <= currentFloor ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </button>
  );
}
