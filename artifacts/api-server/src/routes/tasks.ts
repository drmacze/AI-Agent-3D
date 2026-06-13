import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
    res.json(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      assignedAgentId: t.assignedAgentId,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      progress: t.progress,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

// GET /tasks/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignedAgentId: task.assignedAgentId,
      priority: task.priority,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      progress: task.progress,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get task" });
  }
});

export default router;
