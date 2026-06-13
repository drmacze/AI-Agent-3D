import { useState } from "react";
import { X, Key, User, Zap, Globe, Palette, ChevronDown } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const SKIN_TONES = [
  { label: "Light",       value: "#f4c39a" },
  { label: "Light-Mid",   value: "#e8b89a" },
  { label: "Mid",         value: "#d4956a" },
  { label: "Mid-Tan",     value: "#c07850" },
  { label: "Tan",         value: "#a0784a" },
  { label: "Brown",       value: "#8b5e3c" },
  { label: "Dark Brown",  value: "#6b4020" },
  { label: "Deep",        value: "#3a2010" },
];

const HAIR_COLORS = [
  { label: "Black",      value: "#0f0f0f" },
  { label: "Dark Brown", value: "#1a0f06" },
  { label: "Brown",      value: "#3a2010" },
  { label: "Auburn",     value: "#8b3a0f" },
  { label: "Caramel",    value: "#b07030" },
  { label: "Blonde",     value: "#d4a030" },
  { label: "Platinum",   value: "#f0c060" },
  { label: "White",      value: "#f5f0e8" },
  { label: "Red",        value: "#b82020" },
  { label: "Blue-Black", value: "#1a1a3a" },
  { label: "Navy",       value: "#1a2060" },
  { label: "Indigo",     value: "#4a2090" },
];

const JACKET_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  "#1e293b", "#374151", "#6d28d9", "#065f46",
];

export function SettingsOverlay() {
  const { settings, updateSettings, isSettingsOpen, closeSettings } = useSettings();
  const [tab, setTab] = useState<"ai" | "character" | "openclaw">("ai");

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100" style={{ background: "linear-gradient(135deg,#1e3a5f,#0f172a)" }}>
          <div>
            <h2 className="text-white font-bold text-base">Settings</h2>
            <p className="text-white/50 text-xs">Customize your experience</p>
          </div>
          <button onClick={closeSettings} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { id: "ai",        label: "AI Provider", icon: Zap },
            { id: "character", label: "Character",   icon: User },
            { id: "openclaw",  label: "OpenClaw",    icon: Globe },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                tab === id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "62vh" }}>
          {/* ── AI Provider tab ── */}
          {tab === "ai" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "openai",    label: "🤖 OpenAI",    sub: "GPT-4o mini" },
                    { id: "anthropic", label: "🔮 Anthropic",  sub: "Claude 3 Haiku" },
                    { id: "groq",      label: "⚡ Groq",       sub: "Llama 3.3 70B" },
                    { id: "kimi",      label: "🌙 Kimi 2.6",   sub: "Moonshot AI" },
                    { id: "openclaw",  label: "🦞 OpenClaw",   sub: "Local gateway" },
                  ] as const).map(({ id, label, sub }) => (
                    <button
                      key={id}
                      onClick={() => updateSettings({ apiProvider: id })}
                      className={`py-2.5 px-3 rounded-xl text-left border-2 transition-all ${
                        settings.apiProvider === id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`text-xs font-bold ${settings.apiProvider === id ? "text-blue-700" : "text-gray-600"}`}>{label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {settings.apiProvider !== "openclaw" && (() => {
                const cfg: Record<string, { placeholder: string; hint: string; link: string }> = {
                  openai:    { placeholder: "sk-...",      hint: "Get yours at",   link: "platform.openai.com" },
                  anthropic: { placeholder: "sk-ant-...",  hint: "Get yours at",   link: "console.anthropic.com" },
                  groq:      { placeholder: "gsk_...",     hint: "Free tier at",   link: "console.groq.com" },
                  kimi:      { placeholder: "sk-...",      hint: "Get yours at",   link: "platform.moonshot.cn" },
                };
                const c = cfg[settings.apiProvider] ?? cfg.openai;
                return (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      API Key — {settings.apiProvider.charAt(0).toUpperCase() + settings.apiProvider.slice(1)}
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={settings.apiKey}
                        onChange={e => updateSettings({ apiKey: e.target.value })}
                        placeholder={c.placeholder}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {c.hint}: <a href={`https://${c.link}`} target="_blank" rel="noreferrer" className="underline hover:text-blue-500">{c.link}</a>
                    </p>
                    {settings.apiKey && (
                      <p className="text-xs text-green-600 mt-1">✓ Key saved locally — never sent to our servers</p>
                    )}
                  </div>
                );
              })()}

              {settings.apiProvider === "openclaw" && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700 space-y-1.5">
                  <p className="font-semibold">🦞 OpenClaw selected</p>
                  <p>Go to the <strong>OpenClaw tab</strong> to configure the gateway URL and agent ID.</p>
                  <p>Make sure your OpenClaw gateway is running:</p>
                  <code className="block bg-orange-100 px-2 py-1 rounded font-mono text-[10px]">
                    openclaw gateway --port 18789
                  </code>
                </div>
              )}
            </>
          )}

          {/* ── Character tab ── */}
          {tab === "character" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.playerName}
                    onChange={e => updateSettings({ playerName: e.target.value })}
                    placeholder="Your name"
                    maxLength={20}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Jacket Color</label>
                <div className="flex flex-wrap gap-2">
                  {JACKET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateSettings({ playerColor: c })}
                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        background: c,
                        borderColor: settings.playerColor === c ? "#1e293b" : "transparent",
                        boxShadow: settings.playerColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skin Tone</label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      onClick={() => updateSettings({ playerSkinTone: value })}
                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        background: value,
                        borderColor: settings.playerSkinTone === value ? "#1e293b" : "transparent",
                        boxShadow: settings.playerSkinTone === value ? `0 0 0 2px white, 0 0 0 4px ${value}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hair Color</label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      onClick={() => updateSettings({ playerHairColor: value })}
                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        background: value,
                        borderColor: settings.playerHairColor === value ? "#1e293b" : "transparent",
                        boxShadow: settings.playerHairColor === value ? `0 0 0 2px white, 0 0 0 4px #1e293b` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hair Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["short", "medium", "long", "bun"] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => updateSettings({ playerHairStyle: style })}
                      className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                        settings.playerHairStyle === style
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="flex justify-center py-2">
                <div className="relative">
                  <div className="text-xs text-gray-400 text-center mb-2">Preview</div>
                  <div className="w-16 h-20 relative flex flex-col items-center">
                    {/* Hair */}
                    <div className="w-11 h-5 rounded-t-full" style={{ background: settings.playerHairColor }} />
                    {/* Head */}
                    <div className="w-10 h-10 rounded-xl" style={{ background: settings.playerSkinTone }} />
                    {/* Body */}
                    <div className="w-12 h-8 rounded-b-xl mt-0.5" style={{ background: settings.playerColor }} />
                    {/* Name badge */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold whitespace-nowrap" style={{ background: settings.playerColor, color: "#fff" }}>
                      👑 {settings.playerName || "You"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── OpenClaw tab ── */}
          {tab === "openclaw" && (
            <>
              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🦞</span>
                  <div>
                    <p className="font-bold text-sm text-orange-800">OpenClaw Integration</p>
                    <p className="text-xs text-orange-600">Personal AI assistant gateway</p>
                  </div>
                </div>
                <p className="text-xs text-orange-700">
                  Connect to your locally-running OpenClaw gateway to power all agent conversations with your personal AI assistant.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gateway URL</label>
                <input
                  type="text"
                  value={settings.openclawGatewayUrl}
                  onChange={e => updateSettings({ openclawGatewayUrl: e.target.value })}
                  placeholder="http://localhost:18789"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Default: http://localhost:18789</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Agent ID</label>
                <input
                  type="text"
                  value={settings.openclawAgentId}
                  onChange={e => updateSettings({ openclawAgentId: e.target.value })}
                  placeholder="default"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Setup instructions</p>
                <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400 space-y-1">
                  <div><span className="text-gray-500"># Install OpenClaw</span></div>
                  <div>npm install -g openclaw@latest</div>
                  <div className="mt-1"><span className="text-gray-500"># Start gateway</span></div>
                  <div>openclaw gateway --port 18789</div>
                </div>
                <p className="text-xs text-gray-400">
                  Once running, select <strong>OpenClaw</strong> as your provider in the AI tab to use it for all agent chats.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={closeSettings}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
