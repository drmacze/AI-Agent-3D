import { useState } from "react";
import { useSettings, type ApiProvider } from "@/context/SettingsContext";
import { X, Key, User, Palette, Eye, EyeOff, CheckCircle2, Link, Cpu } from "lucide-react";

const PROVIDERS: { id: ApiProvider; label: string; sub: string; needsKey: boolean }[] = [
  { id: "openclaw",  label: "OpenClaw",  sub: "AI Agents (no key)",  needsKey: false },
  { id: "groq",      label: "Groq",      sub: "Llama 3.3 70B",       needsKey: true },
  { id: "openai",    label: "OpenAI",    sub: "GPT-4o mini",          needsKey: true },
  { id: "anthropic", label: "Anthropic", sub: "Claude Haiku",         needsKey: true },
  { id: "kimi",      label: "Kimi",      sub: "Moonshot v1",          needsKey: true },
];

export function SettingsModal() {
  const { settings, updateSettings, isSettingsOpen, closeSettings } = useSettings();
  const [localKey, setLocalKey] = useState(settings.apiKey);
  const [localName, setLocalName] = useState(settings.playerName);
  const [localColor, setLocalColor] = useState(settings.playerColor);
  const [localProvider, setLocalProvider] = useState<ApiProvider>(settings.apiProvider);
  const [localGwUrl, setLocalGwUrl] = useState(settings.openclawGatewayUrl);
  const [localAgentId, setLocalAgentId] = useState(settings.openclawAgentId);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isSettingsOpen) return null;

  const selectedProvider = PROVIDERS.find(p => p.id === localProvider)!;

  const handleSave = () => {
    updateSettings({
      apiKey: localKey.trim(),
      apiProvider: localProvider,
      playerName: localName.trim() || "You",
      playerColor: localColor,
      openclawGatewayUrl: localGwUrl.trim() || "https://openclaw.ai",
      openclawAgentId: localAgentId.trim() || "default",
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); closeSettings(); }, 900);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-900">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Settings</h2>
              <p className="text-gray-400 text-xs">DLavie OS Configuration</p>
            </div>
          </div>
          <button onClick={closeSettings} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[calc(100dvh-140px)] overflow-y-auto">
          {/* AI Provider */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
              <Cpu className="w-3 h-3" /> AI Provider
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLocalProvider(p.id)}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-sm border-2 transition-all text-left ${
                    localProvider === p.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div>
                    <span className={`font-semibold ${localProvider === p.id ? "text-indigo-700" : "text-gray-700"}`}>{p.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{p.sub}</span>
                  </div>
                  {!p.needsKey && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">No key</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* OpenClaw-specific fields */}
          {localProvider === "openclaw" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Link className="w-3 h-3" /> Gateway URL
                </label>
                <input
                  type="text"
                  value={localGwUrl}
                  onChange={e => setLocalGwUrl(e.target.value)}
                  placeholder="https://openclaw.ai"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 font-mono transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-3 h-3" /> Agent ID
                </label>
                <input
                  type="text"
                  value={localAgentId}
                  onChange={e => setLocalAgentId(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 font-mono transition-all"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                OpenClaw agents don't require an API key
              </div>
            </div>
          )}

          {/* API Key — only for non-openclaw providers */}
          {selectedProvider.needsKey && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Key className="w-3 h-3" /> API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={localKey}
                  onChange={e => setLocalKey(e.target.value)}
                  placeholder={localProvider === "openai" ? "sk-..." : localProvider === "anthropic" ? "sk-ant-..." : "your-api-key"}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 transition-all"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {localKey && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Stored locally — never sent to our servers
                </div>
              )}
            </div>
          )}

          {/* Player name */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <User className="w-3 h-3" /> Player Name
            </label>
            <input
              type="text"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 transition-all"
            />
          </div>

          {/* Player color */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3 h-3" /> Player Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={localColor}
                onChange={e => setLocalColor(e.target.value)}
                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <div className="flex gap-2">
                {["#f59e0b","#3b82f6","#10b981","#ef4444","#8b5cf6","#ec4899"].map(c => (
                  <button
                    key={c}
                    onClick={() => setLocalColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${localColor === c ? "border-gray-700 scale-110" : "border-white hover:scale-105"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3 border-t border-gray-100">
          <button
            onClick={closeSettings}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              saved ? "bg-emerald-500" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {saved ? "Saved" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
