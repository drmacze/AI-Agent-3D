import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, tasksTable, agentMessagesTable, activityEventsTable } from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";

const router = Router();

function formatAgent(a: typeof agentsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    status: a.status,
    currentTask: a.currentTask,
    positionX: a.positionX,
    positionZ: a.positionZ,
    color: a.color,
    interactingWithId: a.interactingWithId,
    completedTasks: a.completedTasks,
    activeTaskId: a.activeTaskId,
    // ── Real Agent Identity ──────────────────────────────────────────────────
    floor: a.floor,
    department: a.department,
    specialty: a.specialty,
    skills: (() => { try { return JSON.parse(a.skills ?? "[]"); } catch { return []; } })(),
    expertiseLevel: a.expertiseLevel,
    modelVersion: a.modelVersion,
    currentJobType: a.currentJobType,
    currentJobPhase: a.currentJobPhase,
    currentJobPhaseIndex: a.currentJobPhaseIndex,
    totalJobPhases: a.totalJobPhases,
    jobsCompleted: a.jobsCompleted,
    lastCollaboratedWith: a.lastCollaboratedWith,
    lastCollaborationAt: a.lastCollaborationAt,
  };
}

// GET /agents
router.get("/", async (req, res) => {
  try {
    const agents = await db.select().from(agentsTable).orderBy(agentsTable.id);
    res.json(agents.map(formatAgent));
  } catch (err) {
    res.status(500).json({ error: "Failed to list agents" });
  }
});

// GET /agents/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (!agent) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatAgent(agent));
  } catch (err) {
    res.status(500).json({ error: "Failed to get agent" });
  }
});

// GET /agents/:id/messages
router.get("/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const messages = await db
      .select()
      .from(agentMessagesTable)
      .where(eq(agentMessagesTable.agentId, id))
      .orderBy(desc(agentMessagesTable.timestamp))
      .limit(20);
    res.json(messages.map(m => ({
      id: m.id,
      agentId: m.agentId,
      targetAgentId: m.targetAgentId,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      type: m.type,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to get messages" });
  }
});

export default router;
