import { useEffect, useRef, useState } from "react";

export function FPSCounter() {
  const [fps, setFps] = useState(0);
  const [ms, setMs] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lastFrameTime = useRef(performance.now());

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      const frameMs = now - lastFrameTime.current;
      lastFrameTime.current = now;
      frameCount.current++;
      const elapsed = now - lastTime.current;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount.current / elapsed) * 1000));
        setMs(Math.round(frameMs * 10) / 10);
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const color = fps >= 55 ? "#22c55e" : fps >= 30 ? "#f59e0b" : "#ef4444";
  const bg = fps >= 55 ? "rgba(0,30,0,0.75)" : fps >= 30 ? "rgba(30,20,0,0.75)" : "rgba(30,0,0,0.75)";

  return (
    <div
      className="fixed top-14 right-2 z-[8500] rounded-lg px-2.5 py-1.5 font-mono text-xs select-none pointer-events-none"
      style={{ background: bg, border: `1px solid ${color}44`, backdropFilter: "blur(4px)" }}
    >
      <div style={{ color }} className="font-bold text-sm">{fps} FPS</div>
      <div className="text-gray-400 text-[10px]">{ms} ms</div>
    </div>
  );
}
