import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, User, Wifi, WifiOff, Loader2, AlertCircle, Zap } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import type { NpcAgent } from "@/context/FloorContext";
import type { Agent } from "@workspace/api-client-react";

type ChatAgent = (Agent & { isNpc?: false }) | (NpcAgent & { isNpc: true });

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  streaming?: boolean;
}

interface Props {
  agent: ChatAgent;
  onClose: () => void;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function ChatOverlay({ agent, onClose }: Props) {
  const { settings, hasApiKey, openSettings } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const agentName  = agent.name;
  const agentRole  = agent.role;
  const agentColor = agent.color;
  const isOpenClaw = settings.apiProvider === "openclaw";
  const isGroq = settings.apiProvider === "groq";
  const isKimi = settings.apiProvider === "kimi";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([{ id: "greet", role: "agent", content: getGreeting(agent) }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [agent.id]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!hasApiKey) { openSettings(); return; }

    setInput("");
    setError(null);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    const agentMsgId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: agentMsgId, role: "agent", content: "", streaming: true }]);
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      let url: string;
      let body: Record<string, unknown>;

      const baseBody = {
        message: text,
        apiKey: settings.apiKey,
        provider: settings.apiProvider,
        playerName: settings.playerName,
        openclawGatewayUrl: settings.openclawGatewayUrl,
        openclawAgentId: settings.openclawAgentId,
      };

      if (agent.isNpc === true) {
        url = `${API_BASE}/api/chat/npc/${agent.id}`;
        body = {
          ...baseBody,
          agentData: {
            name: agent.name,
            role: agent.role,
            personality: agent.personality,
            department: agent.department,
            currentTask: agent.currentTask,
            specialty: (agent as NpcAgent).specialty,
          },
        };
      } else {
        url = `${API_BASE}/api/chat/${agent.id}`;
        body = baseBody;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.error) throw new Error(data.error);
            if (data.content) {
              accumulated += data.content;
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, content: accumulated, streaming: true } : m
              ));
            }
            if (data.done) break;
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") throw parseErr;
          }
        }
      }

      setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, streaming: false } : m));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages(prev => prev.filter(m => m.id !== agentMsgId));
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setMessages(prev => prev.map(m =>
          m.id === agentMsgId ? { ...m, content: `⚠️ ${msg}`, streaming: false } : m
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, hasApiKey, agent, settings, openSettings]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape") onClose();
  };

  const providerBadge = isOpenClaw
    ? <span className="flex items-center gap-1 text-xs text-orange-200 ml-1"><span>🦞</span><span>OpenClaw</span></span>
    : isGroq
      ? <span className="flex items-center gap-1 text-xs text-purple-200 ml-1"><Zap className="w-3 h-3" /><span>Groq</span></span>
      : isKimi
        ? <span className="flex items-center gap-1 text-xs text-blue-200 ml-1"><span>🌙</span><span>Kimi 2.6</span></span>
        : hasApiKey
          ? <span className="flex items-center gap-1 text-xs text-white/70 ml-1"><Wifi className="w-3 h-3" /><span>AI Live</span></span>
          : <span className="flex items-center gap-1 text-xs text-amber-200 ml-1"><WifiOff className="w-3 h-3" /><span>No API Key</span></span>;

  return (
    <div
      className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "80vh", minHeight: 420 }}>
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{ background: `linear-gradient(135deg, ${agentColor}ee, ${agentColor}99)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.35)" }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{agentName}</div>
              <div className="text-white/70 text-xs">{agentRole}</div>
            </div>
            {providerBadge}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* No API key banner */}
        {!hasApiKey && !isOpenClaw && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Set your API key in Settings to chat with AI agents</span>
            <button onClick={openSettings} className="ml-auto font-semibold underline">Open Settings</button>
          </div>
        )}
        {isOpenClaw && (
          <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center gap-2 text-xs text-orange-700">
            <span>🦞</span>
            <span>Powered by OpenClaw — make sure your gateway is running</span>
            <button onClick={openSettings} className="ml-auto font-semibold underline">Settings</button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: msg.role === "agent" ? `${agentColor}22` : "#f1f5f9",
                  border: msg.role === "agent" ? `1.5px solid ${agentColor}44` : "1.5px solid #e2e8f0",
                }}
              >
                {msg.role === "agent"
                  ? <Bot  className="w-3.5 h-3.5" style={{ color: agentColor }} />
                  : <User className="w-3.5 h-3.5 text-gray-500" />}
              </div>
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content || (msg.streaming && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">thinking...</span>
                  </span>
                ))}
                {msg.streaming && msg.content && (
                  <span className="inline-block w-0.5 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasApiKey || isOpenClaw ? `Talk to ${agentName}...` : "Set API key to chat"}
            disabled={isStreaming}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 disabled:opacity-50 transition-all"
            style={{ "--tw-ring-color": agentColor } as React.CSSProperties}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || (!hasApiKey && !isOpenClaw)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 active:scale-95"
            style={{ background: agentColor }}
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function getGreeting(agent: ChatAgent): string {
  if ("isNpc" in agent && agent.isNpc) {
    const npc = agent as NpcAgent;
    const greetings = [
      `Hey! I'm ${npc.name}, ${npc.role} here. Right now I'm working on "${npc.currentTask}". What's on your mind?`,
      `Oh, a visitor! I'm ${npc.name} from the ${npc.department} team. I was just deep in some work — what can I help you with?`,
      `Hi there! ${npc.name} here — ${npc.role} in ${npc.department}. Ask me anything, I love talking about my work!`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else {
    const a = agent as Agent;
    const roles: Record<string, string> = {
      "AI Architect":   `Greetings. I'm ${a.name}, the AI Architect here. I oversee the intelligence layer. What would you like to know?`,
      "ML Engineer":    `Hey! ${a.name} here. My models are training — I've got a moment to chat. What's up?`,
      "Full-Stack Dev": `Yo! ${a.name}. Just pushed some code. What do you need?`,
      "DevOps Lead":    `${a.name} speaking. Infrastructure's stable, I can talk. What's on your mind?`,
      "UX Designer":    `Hi! I'm ${a.name}. Refining wireframes — always happy for a creative break. What brings you over?`,
      "Product Manager":`Hey! ${a.name} here. I'm between standups — perfect timing. What can I do for you?`,
    };
    return roles[a.role] ?? `Hi, I'm ${a.name}. How can I help you?`;
  }
}
