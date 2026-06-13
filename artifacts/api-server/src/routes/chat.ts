import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, agentMessagesTable, activityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function sseHeaders(res: import("express").Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}

// POST /chat/:agentId — DB agents (Floor 1)
router.post("/:agentId", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

  const {
    message, apiKey, provider = "openai",
    playerName = "You", openclawGatewayUrl, openclawAgentId,
  } = req.body as {
    message: string; apiKey?: string;
    provider?: "openai" | "anthropic" | "openclaw";
    playerName?: string; openclawGatewayUrl?: string; openclawAgentId?: string;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (provider !== "openclaw" && !apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  await db.insert(agentMessagesTable).values({ agentId, content: `${playerName}: ${message}`, type: "chat" });
  const systemPrompt = buildSystemPrompt(agent);
  sseHeaders(res);
  let fullResponse = "";

  try {
    if (provider === "openclaw") {
      fullResponse = await streamOpenClaw(openclawGatewayUrl ?? "http://localhost:18789", openclawAgentId ?? "default", systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "anthropic") {
      fullResponse = await streamAnthropic(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else {
      fullResponse = await streamOpenAI(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    }
    await db.insert(agentMessagesTable).values({ agentId, content: fullResponse, type: "chat" });
    await db.insert(activityEventsTable).values({ agentId, type: "chat", description: `${agent.name} replied to ${playerName}`, metadata: JSON.stringify({ preview: fullResponse.slice(0, 80) }) });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
  }
  res.end();
});

// POST /chat/npc/:npcId — NPC agents (Floors 2–5)
router.post("/npc/:npcId", async (req, res) => {
  const {
    message, apiKey, provider = "openai", playerName = "You",
    agentData, openclawGatewayUrl, openclawAgentId,
  } = req.body as {
    message: string; apiKey?: string;
    provider?: "openai" | "anthropic" | "openclaw";
    playerName?: string;
    agentData?: { name: string; role: string; personality: string; department: string; currentTask: string; specialty?: string };
    openclawGatewayUrl?: string; openclawAgentId?: string;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (!agentData) { res.status(400).json({ error: "Agent data is required" }); return; }
  if (provider !== "openclaw" && !apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }

  const systemPrompt = `You are ${agentData.name}, a ${agentData.role} at DLavie OS — an AI-first software company.
Department: ${agentData.department}${agentData.specialty ? `\nSpecialty: ${agentData.specialty}` : ""}
Currently working on: ${agentData.currentTask}
Personality: ${agentData.personality}

Respond in character. Be conversational, authentic to your role, and insightful about your work.
Keep responses concise (2-4 sentences). You're speaking to ${playerName}, a colleague or visitor.`;

  sseHeaders(res);
  let fullResponse = "";

  try {
    if (provider === "openclaw") {
      fullResponse = await streamOpenClaw(openclawGatewayUrl ?? "http://localhost:18789", openclawAgentId ?? "default", systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "anthropic") {
      fullResponse = await streamAnthropic(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else {
      fullResponse = await streamOpenAI(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
  }
  res.end();
});

function buildSystemPrompt(agent: { name: string; role: string; status: string; currentTask?: string | null; personality?: string | null; backstory?: string | null }): string {
  return `You are ${agent.name}, an AI agent working at DLavie OS — an AI-first software company.
Role: ${agent.role} | Status: ${agent.status}
Current task: ${agent.currentTask ?? "general operations"}
${agent.personality ? `Personality: ${agent.personality}` : ""}
${agent.backstory ? `Background: ${agent.backstory}` : ""}
You are a core Floor-1 engineering agent — the most technically sophisticated team at DLavie OS.
Keep responses concise (2-4 sentences), conversational, and in-character.`;
}

// ─── OpenClaw Gateway ────────────────────────────────────────────────────────
async function streamOpenClaw(gatewayUrl: string, agentId: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const base = gatewayUrl.replace(/\/$/, "");

  // Try OpenClaw's agent endpoint first
  try {
    const r = await fetch(`${base}/api/agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, message: `${playerName}: ${userMessage}`, system: systemPrompt, stream: true }),
      signal: AbortSignal.timeout(30000),
    });
    if (r.ok) return readSSEStream(r, onChunk, ["content"]);
  } catch {}

  // Fallback: OpenAI-compatible v1 endpoint (OpenClaw can proxy these)
  const r2 = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "default", stream: true, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${playerName}: ${userMessage}` }] }),
    signal: AbortSignal.timeout(30000),
  }).catch(() => null);

  if (!r2 || !r2.ok) {
    throw new Error(`OpenClaw gateway not reachable at ${base}. Start it with: openclaw gateway --port 18789`);
  }
  return readSSEStream(r2, onChunk, ["choices.0.delta.content"]);
}

async function readSSEStream(response: Response, onChunk: (c: string) => void, paths: string[]): Promise<string> {
  let full = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const d = line.slice(6).trim();
      if (d === "[DONE]") break;
      try {
        const json = JSON.parse(d) as Record<string, unknown>;
        let chunk = "";
        for (const path of paths) {
          const val = path.split(".").reduce((o: unknown, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), json as unknown);
          if (typeof val === "string" && val) { chunk = val; break; }
        }
        if (chunk) { full += chunk; onChunk(chunk); }
      } catch {}
    }
  }
  return full;
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────
async function streamOpenAI(apiKey: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 350, stream: true, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${playerName}: ${userMessage}` }] }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }
  return readSSEStream(response, onChunk, ["choices.0.delta.content"]);
}

// ─── Anthropic ───────────────────────────────────────────────────────────────
async function streamAnthropic(apiKey: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-beta": "messages-2023-12-15" },
    body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 350, stream: true, system: systemPrompt, messages: [{ role: "user", content: `${playerName}: ${userMessage}` }] }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Anthropic: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }
  let full = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const d = line.slice(6).trim();
      try {
        const json = JSON.parse(d) as { type?: string; delta?: { type?: string; text?: string } };
        if (json.type === "content_block_delta" && json.delta?.text) {
          full += json.delta.text; onChunk(json.delta.text);
        }
      } catch {}
    }
  }
  return full;
}

export default router;
