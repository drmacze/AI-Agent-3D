import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0f1117", color: "#e2e8f0", fontFamily: "sans-serif",
          padding: "24px", textAlign: "center", gap: "12px"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(255,255,255,0.07)", display: "flex",
            alignItems: "center", justifyContent: "center", marginBottom: 4
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#6b7280"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>DLavie OS failed to load</p>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 300 }}>
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: "10px 24px", borderRadius: 10,
              background: "#3b82f6", color: "#fff", border: "none",
              fontWeight: 600, fontSize: 14, cursor: "pointer"
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
