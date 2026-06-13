import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentJobsTable = pgTable("agent_jobs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  floor: integer("floor").notNull().default(1),
  department: text("department").notNull(),
  jobType: text("job_type").notNull(),
  jobTitle: text("job_title").notNull(),
  phase: text("phase").notNull().default("scan"),
  phaseIndex: integer("phase_index").notNull().default(0),
  totalPhases: integer("total_phases").notNull().default(5),
  status: text("status").notNull().default("running"),
  progress: integer("progress").notNull().default(0),
  output: text("output"),
  collaboratorAgentId: integer("collaborator_agent_id"),
  collaboratorFloor: integer("collaborator_floor"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAgentJobSchema = createInsertSchema(agentJobsTable).omit({ id: true });
export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type AgentJob = typeof agentJobsTable.$inferSelect;
