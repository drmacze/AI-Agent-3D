import { ReactNode } from "react";
import { TopBar } from "./TopBar";

export default function Layout({ children, isFullScreen = false }: { children: ReactNode; isFullScreen?: boolean }) {
  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col font-sans ${isFullScreen ? 'h-screen overflow-hidden' : ''}`}>
      <TopBar />
      <main className={`flex-1 relative ${isFullScreen ? 'overflow-hidden' : 'p-6 max-w-7xl mx-auto w-full'}`}>
        {children}
      </main>
    </div>
  );
}
