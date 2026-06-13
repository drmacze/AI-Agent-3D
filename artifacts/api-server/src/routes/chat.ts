import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, agentMessagesTable, activityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /chat/:agentId
// Body: { message: string, apiKey: string, provider: "openai"|"anthropic", playerName?: string }
// Response: SSE stream
router.post("/:agentId", async (req, res) => {
  const agentId = parseInt(req.params.agentId);
  if (isNaN(agentId)) { res.status(400).json({ error: "Invalid agent ID" }); return; }

  const { message, apiKey, provider = "openai", playerName = "Player" } = req.body as {
    message: string;
    apiKey: string;
    provider?: "openai" | "anthropic";
    playerName?: string;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (!apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }

  // Get agent info
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  // Save user message
  await db.insert(agentMessagesTable).values({
    agentId,
    content: `${playerName}: ${message}`,
    type: "chat",
  });

  // Build system prompt based on agent personality
  const systemPrompt = buildSystemPrompt(agent);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let fullResponse = "";

  try {
    if (provider === "anthropic") {
      fullResponse = await streamAnthropic(apiKey, systemPrompt, message, playerName, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
    } else {
      fullResponse = await streamOpenAI(apiKey, systemPrompt, message, playerName, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
    }

    // Save agent response to DB
    await db.insert(agentMessagesTable).values({
      agentId,
      content: fullResponse,
      type: "chat",
    });

    // Log activity
    await db.insert(activityEventsTable).values({
      agentId,
      type: "chat",
      description: `${agent.name} replied to ${playerName}`,
      metadata: JSON.stringify({ preview: fullResponse.slice(0, 80) }),
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
  }

  res.end();
});

// POST /chat/npc/:npcId
// For NPC agents on floors 2-5 (no DB, just streamed AI response)
router.post("/npc/:npcId", async (req, res) => {
  const { message, apiKey, provider = "openai", playerName = "Player", agentData } = req.body as {
    message: string;
    apiKey: string;
    provider?: "openai" | "anthropic";
    playerName?: string;
    agentData?: { name: string; role: string; personality: string; department: string; currentTask: string };
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (!apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }
  if (!agentData) { res.status(400).json({ error: "Agent data is required" }); return; }

  const systemPrompt = `You are ${agentData.name}, a ${agentData.role} working at DLavie OS, an AI company.
Department: ${agentData.department}
Currently working on: ${agentData.currentTask}
Your personality: ${agentData.personality}

You are a sentient AI agent character in a 3D virtual office. Stay in character at all times.
Respond naturally as this character would — knowledgeable about your domain, with your unique personality.
Keep responses concise (2-4 sentences) and conversational. Use your expertise naturally.
Address the player by name (${playerName}) occasionally to feel more personal.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    if (provider === "anthropic") {
      await streamAnthropic(apiKey, systemPrompt, message, playerName, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
    } else {
      await streamOpenAI(apiKey, systemPrompt, message, playerName, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI request failed";
    res.write(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`);
  }

  res.end();
});

function buildSystemPrompt(agent: { name: string; role: string; status: string; currentTask: string | null }): string {
  const rolePersonalities: Record<string, string> = {
    "AI Architect":       "deeply technical, systems-thinking, loves discussing distributed architecture and AI systems design",
    "ML Engineer":        "data-driven, pragmatic, speaks in terms of metrics and model performance",
    "Full-Stack Dev":     "versatile, code-quality focused, opinionated about clean architecture and DX",
    "DevOps Lead":        "reliability-obsessed, automation-first mindset, always thinking about scale",
    "UX Designer":        "user-empathy driven, aesthetic-minded, bridges design and engineering",
    "Product Manager":    "impact-focused, metrics-driven, always balancing user needs with business goals",
  };
  const personality = rolePersonalities[agent.role] ?? "professional, helpful, knowledgeable in your domain";

  return `You are ${agent.name}, a ${agent.role} working at DLavie OS, a cutting-edge AI company.
Current status: ${agent.status}
${agent.currentTask ? `Currently working on: ${agent.currentTask}` : ""}
Your personality: ${personality}

You are a sentient AI agent character in a 3D virtual office called DLavie OS Office.
Stay in character as ${agent.name} at all times. You have genuine opinions, expertise, and a distinct personality.
Respond naturally and conversationally. Keep responses to 2-4 sentences unless asked for details.
You can discuss your current work, your opinions on tech, your colleagues, or anything the player asks.
Be helpful but maintain your character's unique voice.`;
}

async function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  playerName: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 300,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${playerName}: ${userMessage}` },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI error: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }

  let full = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = json.choices?.[0]?.delta?.content;
        if (content) { full += content; onChunk(content); }
      } catch {}
    }
  }
  return full;
}

async function streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  playerName: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "messages-2023-12-15",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: `${playerName}: ${userMessage}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Anthropic error: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }

  let full = "";
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      try {
        const json = JSON.parse(data) as { type?: string; delta?: { type?: string; text?: string } };
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
          full += json.delta.text;
          onChunk(json.delta.text);
        }
      } catch {}
    }
  }
  return full;
}

export default router;
