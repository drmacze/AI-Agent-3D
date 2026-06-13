import { db } from "@workspace/db";
import {
  agentsTable,
  tasksTable,
  agentMessagesTable,
  activityEventsTable,
} from "@workspace/db";
import { eq, desc, sql, inArray, and, lt } from "drizzle-orm";
import { logger } from "./logger";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Chair/desk positions per agent ID (matches AgentScene.tsx DESK_STATIONS order) */
const HOME_POS: Record<number, [number, number]> = {
  1: [-5, -1.8],
  2: [-1, -1.8],
  3: [3, -1.8],
  4: [-5, 3.2],
  5: [-1, 3.2],
  6: [3, 3.2],
};

/** Spots near the meeting table for conversation huddles */
const MEETING_SPOTS: Array<[number, number]> = [
  [-0.7, -0.5],
  [0.7, -0.5],
  [-0.7, 0.5],
  [0.7, 0.5],
];

const AGENT_NAMES: Record<number, string> = {
  1: "ARIA",
  2: "NEXUS",
  3: "FORGE",
  4: "SCOUT",
  5: "ECHO",
  6: "VEGA",
};

// ─── Task Templates ───────────────────────────────────────────────────────────

const TASK_POOL = [
  { title: "Analyze anomaly dataset",      description: "Run pattern analysis on the latest sensor anomalies",           priority: "high"   },
  { title: "Deploy recommendation engine", description: "Ship the new microservice to the staging cluster",              priority: "high"   },
  { title: "Refactor auth pipeline",       description: "Replace deprecated OAuth library with current standard",       priority: "medium" },
  { title: "Sprint planning session",      description: "Define scope and tasks for upcoming sprint cycle",             priority: "medium" },
  { title: "Optimise query performance",   description: "Profile slow dashboard queries and add appropriate indexes",    priority: "medium" },
  { title: "Write integration tests",      description: "Cover the new event-bus handler with end-to-end tests",        priority: "low"    },
  { title: "Review PR #52",               description: "Code review for the data-ingestion refactor branch",           priority: "medium" },
  { title: "Document REST endpoints",     description: "Auto-generate and publish OpenAPI spec for v2 endpoints",      priority: "low"    },
  { title: "Security audit — API layer",  description: "Scan endpoints for injection risks and rate-limit gaps",       priority: "high"   },
  { title: "Build knowledge graph",       description: "Extract entity relationships from research corpus",             priority: "medium" },
  { title: "Compile research report",     description: "Summarise competitor landscape findings into a slide deck",    priority: "low"    },
  { title: "Benchmark inference latency", description: "Compare p50/p99 latency across three model serving configs",   priority: "high"   },
  { title: "Update project roadmap",      description: "Align roadmap milestones with updated delivery estimates",     priority: "medium" },
  { title: "Monitor deployment health",   description: "Watch rollout metrics and revert automatically on regression", priority: "high"   },
  { title: "Consolidate log pipelines",   description: "Merge three separate Fluentd configs into a single topology",  priority: "low"    },
  { title: "Data pipeline migration",     description: "Port Spark jobs to the new dbt + DuckDB workflow",             priority: "medium" },
];

// ─── Chat Messages ────────────────────────────────────────────────────────────

type MsgBank = Record<string, string[]>;

const CHAT_MESSAGES: MsgBank = {
  status: [
    "Task is at {p}% — should wrap up shortly.",
    "Making solid progress, about {p}% done.",
    "Blocked on a dependency, pausing at {p}%.",
    "Just past {p}%, accelerating now.",
    "Estimates revised — projecting completion soon.",
  ],
  collaborate: [
    "Can you cross-check those results when you get a moment?",
    "I'm sharing the interim output — feel free to review.",
    "Flagging a potential conflict in the data model, let's align.",
    "Looping you in — your domain expertise would help here.",
    "Want to pair on this section? The logic is tricky.",
  ],
  report: [
    "Completed the analysis — summary posted to the feed.",
    "Deployment succeeded. Rollback is staged just in case.",
    "All tests passing. Merging to main now.",
    "Documentation updated and linked in the ticket.",
    "Security scan clean. Proceeding with the release.",
  ],
  question: [
    "What's your take on the latency spike in sector 3?",
    "Any objections to dropping support for the legacy endpoint?",
    "Should we escalate the auth issue or patch it ourselves?",
    "Have you seen this error pattern in previous datasets?",
    "Do we have runway to refactor before the freeze?",
  ],
  acknowledge: [
    "Noted. I'll adjust my approach accordingly.",
    "Makes sense — syncing my plan with that constraint.",
    "Good call. Updating the task description now.",
    "Agreed. Flagging this for the next standup.",
    "Copy that. Back to it.",
  ],
};

const CHAT_SEQUENCE = ["status", "collaborate", "question", "acknowledge", "report"];

/** Chat state tracker so pairs have natural back-and-forth */
const chatSequenceTracker: Record<string, number> = {};

// ─── Activity Descriptions ────────────────────────────────────────────────────

const EVENT_DESCRIPTIONS = {
  started_task:    (task: string) => `Started working on: ${task}`,
  completed_task:  (task: string) => `Completed task: ${task}`,
  status_change:   (status: string) => `Status changed to: ${status}`,
  chat_initiated:  (other: string) => `Initiated coordination session with ${other}`,
  moved:           (area: string) => `Moved to ${area}`,
  task_progress:   (p: number, task: string) => `Progress on "${task}": ${p}%`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chancePct(pct: number): boolean {
  return Math.random() * 100 < pct;
}

function pickMessage(category: string, progress = 0): string {
  const templates = CHAT_MESSAGES[category] ?? CHAT_MESSAGES.status;
  return pick(templates).replace("{p}", String(progress));
}

// ─── Simulation Class ─────────────────────────────────────────────────────────

class SimulationEngine {
  private running = false;
  private timers: ReturnType<typeof setInterval>[] = [];

  start() {
    if (this.running) return;
    this.running = true;
    logger.info("Simulation engine starting");

    // Tick A — agent state machine (every 5 s)
    this.timers.push(setInterval(() => this.tickAgents(), 5_000));

    // Tick B — inter-agent chat messages (every 7 s, offset 3 s)
    setTimeout(() => {
      this.timers.push(setInterval(() => this.tickChat(), 7_000));
    }, 3_000);

    // Tick C — spawn new tasks (every 22 s)
    this.timers.push(setInterval(() => this.tickTaskSpawn(), 22_000));

    // Tick D — cleanup old events (every 90 s)
    this.timers.push(setInterval(() => this.tickCleanup(), 90_000));

    // Warm start — small delay so DB is ready
    setTimeout(() => this.warmStart(), 2_000);
  }

  stop() {
    this.running = false;
    this.timers.forEach(clearInterval);
    this.timers = [];
    logger.info("Simulation engine stopped");
  }

  // ─── Warm Start ─────────────────────────────────────────────────────────────

  private async warmStart() {
    try {
      const agents = await db.select().from(agentsTable);
      // Ensure every agent is at their home position
      for (const agent of agents) {
        const home = HOME_POS[agent.id];
        if (!home) continue;
        await db.update(agentsTable)
          .set({ positionX: home[0], positionZ: home[1] })
          .where(eq(agentsTable.id, agent.id));
      }
      logger.info("Simulation warm-start complete");
    } catch (err) {
      logger.error({ err }, "Simulation warm-start failed");
    }
  }

  // ─── Tick A: Agent State Machine ─────────────────────────────────────────────

  private async tickAgents() {
    try {
      const agents = await db.select().from(agentsTable);

      for (const agent of agents) {
        // Each agent has a ~60% chance to be processed each tick (keeps it natural)
        if (!chancePct(60)) continue;

        switch (agent.status) {
          case "idle":
            await this.handleIdle(agent);
            break;
          case "working":
            await this.handleWorking(agent);
            break;
          case "chatting":
            await this.handleChatting(agent, agents);
            break;
          case "moving":
            await this.handleMoving(agent);
            break;
        }
      }
    } catch (err) {
      logger.error({ err }, "tickAgents failed");
    }
  }

  private async handleIdle(agent: typeof agentsTable.$inferSelect) {
    // 65% chance to pick up a pending task
    if (!chancePct(65)) return;

    // Find a pending task
    const [pendingTask] = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.status, "pending"))
      .limit(1);

    if (pendingTask) {
      // Assign the task
      await db.update(tasksTable).set({
        status: "in_progress",
        assignedAgentId: agent.id,
        progress: 0,
      }).where(eq(tasksTable.id, pendingTask.id));

      await db.update(agentsTable).set({
        status: "working",
        currentTask: pendingTask.title,
        activeTaskId: pendingTask.id,
      }).where(eq(agentsTable.id, agent.id));

      await this.logEvent(agent.id, AGENT_NAMES[agent.id] ?? agent.name, "started_task",
        EVENT_DESCRIPTIONS.started_task(pendingTask.title));
    } else {
      // No pending tasks — maybe go chat or just wander
      if (chancePct(30)) {
        await db.update(agentsTable).set({
          status: "moving",
          currentTask: "Exploring office",
        }).where(eq(agentsTable.id, agent.id));
      }
    }
  }

  private async handleWorking(agent: typeof agentsTable.$inferSelect) {
    if (!agent.activeTaskId) {
      // Orphaned working state — reset to idle
      await db.update(agentsTable)
        .set({ status: "idle", currentTask: null })
        .where(eq(agentsTable.id, agent.id));
      return;
    }

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, agent.activeTaskId));
    if (!task) {
      await db.update(agentsTable)
        .set({ status: "idle", currentTask: null, activeTaskId: null })
        .where(eq(agentsTable.id, agent.id));
      return;
    }

    const increment = rand(8, 22);
    const newProgress = Math.min(task.progress + increment, 100);

    await db.update(tasksTable).set({ progress: newProgress }).where(eq(tasksTable.id, task.id));

    if (newProgress >= 100) {
      // Task complete!
      await db.update(tasksTable).set({
        status: "completed",
        progress: 100,
        completedAt: new Date(),
      }).where(eq(tasksTable.id, task.id));

      await db.update(agentsTable).set({
        status: "idle",
        currentTask: null,
        activeTaskId: null,
        completedTasks: sql`${agentsTable.completedTasks} + 1`,
      }).where(eq(agentsTable.id, agent.id));

      await this.logEvent(agent.id, AGENT_NAMES[agent.id] ?? agent.name, "completed_task",
        EVENT_DESCRIPTIONS.completed_task(task.title));

    } else {
      // Milestone log ~every 25%
      if (newProgress % 25 < increment && newProgress > 0) {
        await this.logEvent(agent.id, AGENT_NAMES[agent.id] ?? agent.name, "task_progress",
          EVENT_DESCRIPTIONS.task_progress(newProgress, task.title));
      }

      // Small chance to initiate a chat with another working agent
      if (chancePct(12)) {
        await this.tryStartChat(agent);
      }
    }
  }

  private async tryStartChat(agent: typeof agentsTable.$inferSelect) {
    const others = await db
      .select()
      .from(agentsTable)
      .where(sql`id != ${agent.id} AND status IN ('working', 'idle')`);

    if (others.length === 0) return;
    const target = pick(others);

    const meetingSpot = pick(MEETING_SPOTS);
    const targetSpot: [number, number] = [meetingSpot[0] + 0.6, meetingSpot[1]];

    await db.update(agentsTable).set({
      status: "chatting",
      interactingWithId: target.id,
      positionX: meetingSpot[0],
      positionZ: meetingSpot[1],
      currentTask: `Coordinating with ${AGENT_NAMES[target.id] ?? target.name}`,
    }).where(eq(agentsTable.id, agent.id));

    await db.update(agentsTable).set({
      status: "chatting",
      interactingWithId: agent.id,
      positionX: targetSpot[0],
      positionZ: targetSpot[1],
      currentTask: `Coordinating with ${AGENT_NAMES[agent.id] ?? agent.name}`,
    }).where(eq(agentsTable.id, target.id));

    await this.logEvent(agent.id, AGENT_NAMES[agent.id] ?? agent.name, "chat_initiated",
      EVENT_DESCRIPTIONS.chat_initiated(AGENT_NAMES[target.id] ?? target.name));
  }

  private async handleChatting(
    agent: typeof agentsTable.$inferSelect,
    allAgents: (typeof agentsTable.$inferSelect)[],
  ) {
    // 30% chance to wrap up chat and return to desk
    if (chancePct(30)) {
      const home = HOME_POS[agent.id];

      // Clear the chat partner too (if they're chatting with this agent)
      if (agent.interactingWithId) {
        const partner = allAgents.find(a => a.id === agent.interactingWithId);
        if (partner && partner.interactingWithId === agent.id) {
          const partnerHome = HOME_POS[partner.id];
          await db.update(agentsTable).set({
            status: "idle",
            interactingWithId: null,
            currentTask: null,
            positionX: partnerHome?.[0] ?? partner.positionX,
            positionZ: partnerHome?.[1] ?? partner.positionZ,
          }).where(eq(agentsTable.id, partner.id));
        }
      }

      await db.update(agentsTable).set({
        status: "idle",
        interactingWithId: null,
        currentTask: null,
        positionX: home?.[0] ?? agent.positionX,
        positionZ: home?.[1] ?? agent.positionZ,
      }).where(eq(agentsTable.id, agent.id));
    }
  }

  private async handleMoving(agent: typeof agentsTable.$inferSelect) {
    // Moving agents arrive after a tick
    if (chancePct(70)) {
      const home = HOME_POS[agent.id];
      await db.update(agentsTable).set({
        status: "idle",
        currentTask: null,
        positionX: home?.[0] ?? agent.positionX,
        positionZ: home?.[1] ?? agent.positionZ,
      }).where(eq(agentsTable.id, agent.id));

      await this.logEvent(agent.id, AGENT_NAMES[agent.id] ?? agent.name, "moved",
        EVENT_DESCRIPTIONS.moved("desk"));
    }
  }

  // ─── Tick B: Chat Messages ────────────────────────────────────────────────────

  private async tickChat() {
    try {
      // Find all currently chatting agents with a valid partner
      const chatters = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.status, "chatting"));

      // Deduplicate pairs so only one message per pair per tick
      const processed = new Set<string>();

      for (const agent of chatters) {
        if (!agent.interactingWithId) continue;
        const pairKey = [agent.id, agent.interactingWithId].sort().join("-");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const seqIdx = chatSequenceTracker[pairKey] ?? 0;
        const category = CHAT_SEQUENCE[seqIdx % CHAT_SEQUENCE.length];

        // Get task progress for context
        let progress = 0;
        if (agent.activeTaskId) {
          const [task] = await db.select().from(tasksTable)
            .where(eq(tasksTable.id, agent.activeTaskId));
          progress = task?.progress ?? 0;
        }

        const content = pickMessage(category, progress);

        // Agent sends message to partner
        await db.insert(agentMessagesTable).values({
          agentId: agent.id,
          targetAgentId: agent.interactingWithId,
          content,
          type: "chat",
        });

        // Activity event for the message
        await this.logEvent(
          agent.id,
          AGENT_NAMES[agent.id] ?? agent.name,
          "message",
          `To ${AGENT_NAMES[agent.interactingWithId] ?? "agent"}: ${content}`,
        );

        chatSequenceTracker[pairKey] = seqIdx + 1;
      }
    } catch (err) {
      logger.error({ err }, "tickChat failed");
    }
  }

  // ─── Tick C: Task Spawner ─────────────────────────────────────────────────────

  private async tickTaskSpawn() {
    try {
      const [stats] = await db
        .select({
          active: sql<number>`count(*) filter (where status in ('pending', 'in_progress'))`,
        })
        .from(tasksTable);

      const activeCount = Number(stats?.active ?? 0);

      // Keep 3–6 tasks in the queue
      if (activeCount >= 6) return;

      const template = pick(TASK_POOL);

      await db.insert(tasksTable).values({
        title: template.title,
        description: template.description,
        priority: template.priority as "high" | "medium" | "low",
        status: "pending",
        progress: 0,
      });

      logger.debug({ task: template.title }, "New task spawned");
    } catch (err) {
      logger.error({ err }, "tickTaskSpawn failed");
    }
  }

  // ─── Tick D: Cleanup ──────────────────────────────────────────────────────────

  private async tickCleanup() {
    try {
      // Keep only the most recent 120 activity events
      const [{ maxId }] = await db
        .select({ maxId: sql<number>`max(id)` })
        .from(activityEventsTable);

      if (maxId && maxId > 120) {
        await db
          .delete(activityEventsTable)
          .where(lt(activityEventsTable.id, maxId - 120));
      }

      // Keep only the most recent 200 messages
      const [{ maxMsgId }] = await db
        .select({ maxMsgId: sql<number>`max(id)` })
        .from(agentMessagesTable);

      if (maxMsgId && maxMsgId > 200) {
        await db
          .delete(agentMessagesTable)
          .where(lt(agentMessagesTable.id, maxMsgId - 200));
      }

      // Remove completed tasks older than 3 minutes to keep the board fresh
      const cutoff = new Date(Date.now() - 3 * 60 * 1000);
      await db
        .delete(tasksTable)
        .where(
          sql`status = 'completed' AND completed_at < ${cutoff.toISOString()}`,
        );

      logger.debug("Cleanup tick complete");
    } catch (err) {
      logger.error({ err }, "tickCleanup failed");
    }
  }

  // ─── Utility ──────────────────────────────────────────────────────────────────

  private async logEvent(
    agentId: number,
    agentName: string,
    eventType: string,
    description: string,
  ) {
    await db.insert(activityEventsTable).values({
      agentId,
      agentName,
      eventType,
      description,
    });
  }
}

// Singleton
export const simulation = new SimulationEngine();
