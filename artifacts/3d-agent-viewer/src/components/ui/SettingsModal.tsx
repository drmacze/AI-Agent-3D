import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { X, Key, User, Palette, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export function SettingsModal() {
  const { settings, updateSettings, isSettingsOpen, closeSettings } = useSettings();
  const [localKey, setLocalKey] = useState(settings.apiKey);
  const [localName, setLocalName] = useState(settings.playerName);
  const [localColor, setLocalColor] = useState(settings.playerColor);
  const [localProvider, setLocalProvider] = useState(settings.apiProvider);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    updateSettings({
      apiKey: localKey.trim(),
      apiProvider: localProvider,
      playerName: localName.trim() || "You",
      playerColor: localColor,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); closeSettings(); }, 900);
  };

  const maskedKey = localKey.length > 8
    ? localKey.slice(0, 4) + "••••••••" + localKey.slice(-4)
    : localKey ? "••••••••" : "";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700">
          <div>
            <h2 className="text-white font-bold text-lg">Settings</h2>
            <p className="text-slate-300 text-xs mt-0.5">DLavie OS Office Configuration</p>
          </div>
          <button onClick={closeSettings} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* API Provider */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Key className="w-3.5 h-3.5" /> AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["openai", "anthropic"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setLocalProvider(p)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    localProvider === p
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {p === "openai" ? "🤖 OpenAI" : "🔮 Anthropic"}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Key className="w-3.5 h-3.5" /> API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder={localProvider === "openai" ? "sk-..." : "sk-ant-..."}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                autoComplete="off"
                autoCapitalize="off"
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
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Key stored locally — never sent to our servers</span>
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Key stays in your browser (localStorage) only</span>
            </div>
          </div>

          {/* Player name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5" /> Your Name (Player Character)
            </label>
            <input
              type="text"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
            />
          </div>

          {/* Player color */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5" /> Player Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={localColor}
                onChange={e => setLocalColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <div className="flex gap-2">
                {["#f59e0b","#3b82f6","#10b981","#ef4444","#8b5cf6","#ec4899"].map(c => (
                  <button
                    key={c}
                    onClick={() => setLocalColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${localColor === c ? "border-gray-800 scale-110" : "border-white hover:scale-105"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={closeSettings}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
              saved ? "bg-green-500" : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            }`}
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
