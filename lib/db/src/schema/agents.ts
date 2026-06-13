import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
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
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
