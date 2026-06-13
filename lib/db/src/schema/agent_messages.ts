import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentMessagesTable = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  targetAgentId: integer("target_agent_id"),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull().default("chat"),
});

export const insertAgentMessageSchema = createInsertSchema(agentMessagesTable).omit({ id: true });
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;
export type AgentMessage = typeof agentMessagesTable.$inferSelect;
