import { Router } from "express";
import { db } from "@workspace/db";
import { agentsTable, tasksTable, agentMessagesTable, activityEventsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

// GET /dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const [agentStats] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where status != 'idle')`,
      })
      .from(agentsTable);

    const [taskStats] = await db
      .select({
        completed: sql<number>`count(*) filter (where status = 'completed')`,
        pending: sql<number>`count(*) filter (where status = 'pending')`,
        inProgress: sql<number>`count(*) filter (where status = 'in_progress')`,
      })
      .from(tasksTable);

    const [msgCount] = await db.select({ total: count() }).from(agentMessagesTable);

    res.json({
      totalAgents: Number(agentStats?.total ?? 0),
      activeAgents: Number(agentStats?.active ?? 0),
      completedTasks: Number(taskStats?.completed ?? 0),
      pendingTasks: Number(taskStats?.pending ?? 0),
      inProgressTasks: Number(taskStats?.inProgress ?? 0),
      totalMessages: Number(msgCount?.total ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get summary" });
  }
});

export default router;
