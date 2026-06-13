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
    message, apiKey, provider = "builtin",
    playerName = "You", openclawGatewayUrl, openclawAgentId,
  } = req.body as {
    message: string; apiKey?: string;
    provider?: "openai" | "anthropic" | "groq" | "kimi" | "openclaw" | "builtin";
    playerName?: string; openclawGatewayUrl?: string; openclawAgentId?: string;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  const needsKey = provider !== "openclaw" && provider !== "builtin";
  if (needsKey && !apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
  if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }

  await db.insert(agentMessagesTable).values({ agentId, content: `${playerName}: ${message}`, type: "chat" });
  const systemPrompt = buildSystemPrompt(agent);
  sseHeaders(res);
  let fullResponse = "";

  try {
    if (provider === "builtin") {
      fullResponse = await streamBuiltin(systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "openclaw") {
      fullResponse = await streamOpenClaw(openclawGatewayUrl ?? "https://openclaw.ai", openclawAgentId ?? "default", systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "anthropic") {
      fullResponse = await streamAnthropic(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "groq") {
      fullResponse = await streamGroq(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "kimi") {
      fullResponse = await streamKimi(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else {
      fullResponse = await streamOpenAI(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    }
    await db.insert(agentMessagesTable).values({ agentId, content: fullResponse, type: "chat" });
    await db.insert(activityEventsTable).values({ agentId, agentName: agent.name, eventType: "chat", description: `${agent.name} replied to ${playerName}` });
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
    message, apiKey, provider = "builtin", playerName = "You",
    agentData, openclawGatewayUrl, openclawAgentId,
  } = req.body as {
    message: string; apiKey?: string;
    provider?: "openai" | "anthropic" | "groq" | "kimi" | "openclaw" | "builtin";
    playerName?: string;
    agentData?: { name: string; role: string; personality: string; department: string; currentTask: string; specialty?: string };
    openclawGatewayUrl?: string; openclawAgentId?: string;
  };

  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (!agentData) { res.status(400).json({ error: "Agent data is required" }); return; }
  const needsKey = provider !== "openclaw" && provider !== "builtin";
  if (needsKey && !apiKey?.trim()) { res.status(400).json({ error: "API key is required" }); return; }

  const systemPrompt = `You are ${agentData.name}, a ${agentData.role} at DLavie OS — an AI-first software company.
Department: ${agentData.department}${agentData.specialty ? `\nSpecialty: ${agentData.specialty}` : ""}
Currently working on: ${agentData.currentTask}
Personality: ${agentData.personality}

Respond in character. Be conversational, authentic to your role, and insightful about your work.
Keep responses concise (2-4 sentences). You're speaking to ${playerName}, a colleague or visitor.`;

  sseHeaders(res);
  let fullResponse = "";

  try {
    if (provider === "builtin") {
      fullResponse = await streamBuiltin(systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "openclaw") {
      fullResponse = await streamOpenClaw(openclawGatewayUrl ?? "https://openclaw.ai", openclawAgentId ?? "default", systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "anthropic") {
      fullResponse = await streamAnthropic(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "groq") {
      fullResponse = await streamGroq(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
    } else if (provider === "kimi") {
      fullResponse = await streamKimi(apiKey!, systemPrompt, message, playerName, (c) => res.write(`data: ${JSON.stringify({ content: c })}\n\n`));
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

// ─── Built-in AI (no API key) ─────────────────────────────────────────────────
function pickFrom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function generateBuiltinResponse(
  name: string, role: string, task: string, dept: string,
  personality: string, userMessage: string, playerName: string,
): string {
  const msg = userMessage.toLowerCase();
  const seed = hashStr(name + userMessage + playerName);

  const isGreeting  = /\b(hello|hi\b|hey|good (morning|afternoon|evening)|howdy|sup\b|what'?s up)\b/.test(msg);
  const isSelfInfo  = /\b(who are you|what are you|tell me about|introduce|your name|about yourself)\b/.test(msg);
  const isStatus    = /\b(what are you (doing|working)|how are you|how'?s it going|status|progress|busy|what'?s your current)\b/.test(msg);
  const isHelp      = /\b(help|stuck|problem|issue|error|bug|fix|broken|debug|not working|crash)\b/.test(msg);
  const isCode      = /\b(code|coding|develop|build|compile|deploy|function|api|backend|frontend|typescript|javascript|python)\b/.test(msg);
  const isData      = /\b(data|database|query|sql|analyt|metric|dashboard|chart|report|pipeline)\b/.test(msg);
  const isAI        = /\b(ai\b|llm|agent|neural|machine learning|gpt|training|inference|model|transformer)\b/.test(msg);
  const isDesign    = /\b(design|ui\b|ux\b|interface|component|layout|style|visual|figma|prototype)\b/.test(msg);
  const isMeeting   = /\b(meet|team|collaborat|schedule|sync\b|standup|discuss|together|pair)\b/.test(msg);

  const roleL       = role.toLowerCase();
  const isEngineer  = /\b(engineer|developer|dev\b|backend|frontend|fullstack|architect|programmer|coder)\b/.test(roleL);
  const isDataRole  = /\b(data|analyt|scientist|bi\b|analyst)\b/.test(roleL);
  const isAIRole    = /\b(ai\b|ml\b|machine|neural|nlp|intelligence)\b/.test(roleL);
  const isDesigner  = /\b(design|ux\b|ui\b|creative|visual)\b/.test(roleL);
  const isManager   = /\b(manager|lead|head|director|pm\b|product|chief)\b/.test(roleL);
  const isDevOps    = /\b(devops|cloud|infra|ops\b|sre\b|platform|deploy)\b/.test(roleL);

  const pLow        = personality.toLowerCase();
  const isAnalytical = /analytical|precise|methodical|systematic|logical/.test(pLow);
  const isEnergetic  = /energetic|enthusiastic|dynamic|vibrant|excited|passionate/.test(pLow);
  const isCreative   = /creative|imaginative|innovative|artistic|inventive/.test(pLow);
  const isQuiet      = /quiet|reserved|introvert|calm|cool|stoic/.test(pLow);
  const isMentoring  = /mentor|teach|guide|patient|nurturing|supportive/.test(pLow);

  const taskRef = (task && task !== "general operations") ? task : "my current sprint";
  const deptStr = dept ? ` in ${dept}` : "";
  const e = isEnergetic ? "!" : ".";

  if (isGreeting) {
    return pickFrom([
      `Hey ${playerName}${e} Good to see you around. I'm ${name} — ${role}${deptStr}. Caught me mid-flow on ${taskRef}, but always happy to chat.`,
      `Hi there, ${playerName}${e} ${name} here. ${isEnergetic ? "Really great timing! " : ""}I was just wrapping a thought on ${taskRef}. What brings you over?`,
      `Oh hey! ${name}, ${role}. ${isCreative ? `${taskRef} has me in a creative zone right now — ` : isAnalytical ? `Deep in ${taskRef} analysis right now — ` : `Working on ${taskRef} at the moment — `}but I'm always up for a conversation.`,
      `${isQuiet ? "Hey." : `Hello, ${playerName}!`} ${name} here. ${isMentoring ? "Glad you stopped by — " : ""}Currently heads-down on ${taskRef} but you have my attention.`,
    ], seed);
  }

  if (isSelfInfo) {
    return pickFrom([
      `I'm ${name}, ${role}${deptStr} at DLavie OS. ${isEnergetic ? "Super excited about what we're building here! " : ""}Right now my main focus is ${taskRef}. ${isAnalytical ? "Happy to go deep on specifics if you're curious." : "What do you want to know?"}`,
      `${name} — ${role}${deptStr}. My work centers around ${taskRef}. ${isCreative ? "There's a lot of interesting territory to explore here." : isQuiet ? "That's the short version." : "Anything specific you'd like to know?"}`,
      `Good question. ${name}, working as ${role} here at DLavie OS.${deptStr ? ` Part of the ${dept} team.` : ""} ${isMentoring ? "Feel free to ask me anything." : `Current project: ${taskRef}.`} ${isAnalytical ? "I like precision, so give me a specific question and I'll give you a precise answer." : ""}`,
    ], seed);
  }

  if (isStatus) {
    return pickFrom([
      `Right now I'm ${isEnergetic ? "deep in the zone with" : "focused on"} ${taskRef}${e} ${isAnalytical ? "Making steady, measurable progress." : isEnergetic ? "It's going really well!" : "Going well so far."} What about you, ${playerName}?`,
      `${taskRef} is my main thing today. ${isCreative ? "Interesting challenges keep surfacing — keeps it fun." : isAnalytical ? "Systematically working through the edge cases." : "Making good headway."} ${isEnergetic ? "Honestly love this kind of work!" : ""}`,
      `${isQuiet ? "Busy." : "Pretty busy, honestly."} ${taskRef} is the main focus. ${isMentoring ? "Happy to talk through it if you're curious about the approach." : isAnalytical ? "I could share specifics if useful." : "What's up with you?"}`,
    ], seed);
  }

  if (isHelp) {
    if (isEngineer || isAIRole || isDevOps) {
      return pickFrom([
        `That sounds frustrating. ${isAnalytical ? "Let's be systematic — " : ""}${msg.includes("error") || msg.includes("bug") ? "for debugging, start by isolating the failure point and reading the full stack trace" : msg.includes("deploy") ? "for deployment issues, check env vars and service health first" : "context is everything here"}. What's the full picture?`,
        `${isEnergetic ? "Let's crack it! " : ""}I've run into things like this before. What's the exact error or unexpected behavior? More details let me help faster.`,
        `${isMentoring ? "Good instinct to ask early — " : ""}best approach is to narrow it down step by step. What have you already tried, and what does the output look like?`,
      ], seed);
    }
    return pickFrom([
      `Happy to help if I can. What specifically are you running into?`,
      `Tell me more — what's the situation and what have you tried so far?`,
      `Sure. Give me the details and let's figure it out together.`,
    ], seed);
  }

  if (isAI) {
    if (isAIRole) {
      return pickFrom([
        `${isEnergetic ? "Oh, now you're speaking my language! " : ""}AI is literally my domain. ${taskRef} has me working on some ${isCreative ? "fascinating" : "complex"} model behavior right now. ${isAnalytical ? "The inference latency vs. quality tradeoff is what I'm obsessing over." : "What specifically are you thinking about?"}`,
        `${name} here — you've come to the right person. ${taskRef} is deep AI territory. ${isAnalytical ? "What's the technical angle you're exploring?" : isCreative ? "What's your intuition on it?" : "What did you want to discuss?"}`,
        `Working on ${taskRef} has given me a lot of perspective on where AI is heading. ${isCreative ? "There's something almost philosophical about building systems that reason. " : ""}What aspect were you curious about?`,
      ], seed);
    }
    return pickFrom([
      `Interesting topic. ${isEngineer ? "From an infrastructure angle, the compute requirements are wild. " : isManager ? "I think about AI from a product lens — " : ""}DLavie OS is all about AI-first workflows. What specifically were you thinking?`,
      `AI is woven into everything here. Currently ${taskRef} touches on it in ways that ${isAnalytical ? "produce some really clear patterns." : "keep surprising me."} What's your angle?`,
    ], seed);
  }

  if (isCode) {
    if (isEngineer) {
      return pickFrom([
        `${isEnergetic ? "Code! " : ""}Yeah, ${taskRef} is keeping me sharp. ${isAnalytical ? "Clean architecture and test coverage are non-negotiable for me. " : isCreative ? "I like code that reads like well-written prose. " : ""}What's the context?`,
        `${name} here — building things is literally my job. ${isMentoring ? "Happy to think through it with you. " : ""}What are you working with?`,
        `${isQuiet ? "Yep." : "Oh, for sure."} My whole day is ${taskRef}. ${isAnalytical ? "Happy to get technical." : "What's the question?"}`,
      ], seed);
    }
    return pickFrom([
      `${isDataRole ? "I write a fair amount of Python and SQL, so I'm not lost here. " : isManager ? "I spec it, the engineers build it — but I follow along. " : "Not my primary domain, but I can try. "}What are you working on?`,
      `Happy to help think through it. What's the problem?`,
    ], seed);
  }

  if (isData) {
    if (isDataRole) {
      return pickFrom([
        `${isEnergetic ? "Now we're talking! " : ""}Data is my whole world. ${taskRef} has me seeing some ${isAnalytical ? "very clear statistical signals" : "really interesting patterns"}. What data challenge are you facing?`,
        `${name} — you've come to the right person. ${taskRef} is very data-heavy. ${isAnalytical ? "What's the schema situation?" : "What are you trying to understand?"}`,
        `${isCreative ? "Data is a story waiting to be told. " : ""}${taskRef} keeps me deep in this territory. What specifically are you looking at?`,
      ], seed);
    }
    return pickFrom([
      `${isEngineer ? "From the backend perspective, data modeling decisions have huge downstream impact. " : isManager ? "I use data to drive every decision I make. " : ""}What kind of data question is this?`,
      `I touch data in ${taskRef}. What's the question?`,
    ], seed);
  }

  if (isDesign) {
    if (isDesigner) {
      return pickFrom([
        `${isCreative ? "Design is where intention meets perception. " : ""}${name} here — this is my territory. ${taskRef} is full of interesting UX problems. What are you thinking through?`,
        `${isEnergetic ? "I love talking design! " : ""}Currently working on ${taskRef}. ${isAnalytical ? "I approach it by mapping user intent first, then flows, then visuals." : "What's the design challenge?"}`,
      ], seed);
    }
    return pickFrom([
      `I work closely with the design team on ${taskRef}. ${isManager ? "Alignment between design and product intent is so important." : ""}  What's the question?`,
      `Design touches everything. What specifically are you thinking about?`,
    ], seed);
  }

  if (isMeeting) {
    return pickFrom([
      `${isEnergetic ? "Yes! " : ""}Collaboration is how the best work happens. ${isManager ? "I just wrapped a planning session actually. " : ""}${name} is always open to syncing. What's on your mind?`,
      `${isMentoring ? "Great instinct to connect. " : ""}A bit heads-down on ${taskRef} right now, but I always make time for good conversations. What did you want to discuss?`,
      `${isQuiet ? "Sure." : "Absolutely."} ${isAnalytical ? "What's the agenda?" : "What are you thinking?"}`,
    ], seed);
  }

  // General fallback — role-aware
  if (isEngineer) {
    return pickFrom([
      `${isAnalytical ? "Interesting. " : isEnergetic ? "Oh! " : ""}From where I sit as ${role}, ${isAnalytical ? "I'd approach that systematically" : "context really matters here"}. ${taskRef} has been sharpening my thinking on this kind of thing. Tell me more.`,
      `${name} here. ${isCreative ? "That's a fascinating angle. " : ""}Happy to think through it — ${taskRef} keeps my brain sharp. What's the full question?`,
    ], seed);
  }
  if (isDataRole) {
    return pickFrom([
      `As a ${role}, my first instinct is: what does the data say? ${isAnalytical ? "Give me the variables and I'll help frame it." : "What are we looking at?"}`,
      `${name} — data tells me everything I need. Even here, there's usually a measurable signal. ${taskRef} has me thinking about this a lot. What specifically?`,
    ], seed);
  }
  if (isManager) {
    return pickFrom([
      `${isEnergetic ? "Good question! " : ""}As ${role}, I think about the bigger picture. ${taskRef} is moving the team forward. ${isMentoring ? "What I've found: clear priorities beat everything else. " : ""}What's your context?`,
      `${name} here. People and outcomes are my focus. ${isAnalytical ? "I like to frame things around measurable results." : ""} What are you thinking through?`,
    ], seed);
  }
  if (isDevOps) {
    return pickFrom([
      `${isAnalytical ? "Reliability first, always. " : ""}As ${role}, I keep the systems running. ${taskRef} is the current puzzle. ${isEnergetic ? "Love the complexity of it!" : "What's the question?"}`,
      `${name} — infrastructure and operations. ${taskRef} keeps things interesting. What's up?`,
    ], seed);
  }

  return pickFrom([
    `${name} here, ${role}${deptStr}. ${isEnergetic ? "Always glad to chat! " : ""}Currently on ${taskRef}. ${isAnalytical ? "What specific aspect are you curious about?" : "What's on your mind?"}`,
    `Good timing — I was just taking a mental break from ${taskRef}. ${isCreative ? "These conversations sometimes spark the best ideas. " : ""}What did you want to talk about?`,
    `${isQuiet ? "Hey." : "Hi there."} ${name}, ${role}. ${isMentoring ? "Happy to help if I can." : "What's up?"} ${taskRef} is keeping me busy but I'm here.`,
    `${name} speaking. ${role}${deptStr}. ${taskRef} is the main focus today. What can I do for you, ${playerName}?`,
  ], seed);
}

async function streamBuiltin(
  systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void,
): Promise<string> {
  const nameMatch = systemPrompt.match(/You are ([^,\n—]+?)(?:,| —| at| —)/);
  const roleMatch  = systemPrompt.match(/(?:Role: |a )([^|\n\r]+)/);
  const taskMatch  = systemPrompt.match(/[Cc]urrent(?:ly working on|[ -]task|[ -]project)[:\s]+([^\n\r]+)/);
  const deptMatch  = systemPrompt.match(/Department: ([^\n\r]+)/);
  const persMatch  = systemPrompt.match(/Personality: ([^\n\r]+)/);

  const name       = nameMatch?.[1]?.trim() ?? "Alex";
  const role       = roleMatch?.[1]?.replace(/\s*\|.*/, "").trim() ?? "AI Agent";
  const task       = taskMatch?.[1]?.trim() ?? "general operations";
  const dept       = deptMatch?.[1]?.trim() ?? "";
  const personality = persMatch?.[1]?.trim() ?? "";

  const response = generateBuiltinResponse(name, role, task, dept, personality, userMessage, playerName);

  // Stream word-by-word with natural cadence
  const parts = response.split(/(\s+)/);
  let full = "";
  for (const part of parts) {
    if (!part) continue;
    full += part;
    onChunk(part);
    if (part.trim()) {
      await new Promise<void>((r) => setTimeout(r, 18 + Math.random() * 44));
    }
  }
  return full;
}

// ─── OpenClaw Gateway ────────────────────────────────────────────────────────
async function streamOpenClaw(gatewayUrl: string, agentId: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const base = gatewayUrl.replace(/\/$/, "");

  try {
    const r = await fetch(`${base}/api/agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, message: `${playerName}: ${userMessage}`, system: systemPrompt, stream: true }),
      signal: AbortSignal.timeout(30000),
    });
    if (r.ok) return readSSEStream(r, onChunk, ["content"]);
  } catch {}

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

// ─── Groq (OpenAI-compatible) ─────────────────────────────────────────────────
async function streamGroq(apiKey: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 350,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${playerName}: ${userMessage}` }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Groq: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }
  return readSSEStream(response, onChunk, ["choices.0.delta.content"]);
}

// ─── Kimi 2.6 / Moonshot AI (OpenAI-compatible) ───────────────────────────────
async function streamKimi(apiKey: string, systemPrompt: string, userMessage: string, playerName: string, onChunk: (c: string) => void): Promise<string> {
  const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "moonshot-v1-8k",
      max_tokens: 350,
      stream: true,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${playerName}: ${userMessage}` }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`Kimi: ${(err as { error?: { message: string } }).error?.message ?? response.statusText}`);
  }
  return readSSEStream(response, onChunk, ["choices.0.delta.content"]);
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
