import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("idle"),
  currentTask: text("current_task"),
  positionX: real("position_x").notNull().default(0),
  positionZ: real("position_z").notNull().default(0),
  color: text("color").notNull().default("#4fc3f7"),
  interactingWithId: integer("interacting_with_id"),
  completedTasks: integer("completed_tasks").notNull().default(0),
  activeTaskId: integer("active_task_id"),
  // ── Real Agent Identity ──────────────────────────────────────────────────
  floor: integer("floor").notNull().default(1),
  department: text("department").notNull().default("Engineering"),
  specialty: text("specialty").notNull().default("Backend Systems"),
  skills: text("skills").notNull().default('["scan","reason","make","test","iterate"]'),
  expertiseLevel: integer("expertise_level").notNull().default(1),
  modelVersion: text("model_version").notNull().default("dlv-0.1.0"),
  memoryContext: text("memory_context"),
  currentJobType: text("current_job_type"),
  currentJobPhase: text("current_job_phase"),
  currentJobPhaseIndex: integer("current_job_phase_index").notNull().default(0),
  totalJobPhases: integer("total_job_phases").notNull().default(5),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  lastCollaboratedWith: integer("last_collaborated_with"),
  lastCollaborationAt: timestamp("last_collaboration_at"),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
