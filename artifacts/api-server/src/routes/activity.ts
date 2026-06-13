import { Router } from "express";
import { db } from "@workspace/db";
import { activityEventsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// GET /activity/feed
router.get("/feed", async (req, res) => {
  try {
    const events = await db
      .select()
      .from(activityEventsTable)
      .orderBy(desc(activityEventsTable.timestamp))
      .limit(50);
    res.json(events.map(e => ({
      id: e.id,
      agentId: e.agentId,
      agentName: e.agentName,
      eventType: e.eventType,
      description: e.description,
      timestamp: e.timestamp.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to get activity feed" });
  }
});

export default router;
