import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { invitations } from "./invitations.js"

const aiAnalysisLogs = pgTable("ai_analysis_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull(),
  invitationId: uuid("invitation_id").references(() => invitations.id, {
    onDelete: "set null",
  }),
  generationIndex: integer("generation_index").notNull(),
  rawText: text("raw_text").notNull(),
  additionalPrompt: text("additional_prompt"),
  requestPayload: jsonb("request_payload").notNull(),
  responsePayload: jsonb("response_payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

type AiAnalysisLog = typeof aiAnalysisLogs.$inferSelect
type NewAiAnalysisLog = typeof aiAnalysisLogs.$inferInsert

export { aiAnalysisLogs, type AiAnalysisLog, type NewAiAnalysisLog }
