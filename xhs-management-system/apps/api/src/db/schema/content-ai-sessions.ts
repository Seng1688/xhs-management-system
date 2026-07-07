import { relations } from "drizzle-orm"
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { contents } from "./contents.js"
import { invitations } from "./invitations.js"

type ContentAssistantConfigSnapshot = {
  bannedWords: string[]
  language: string
  maxWords: number
  minWords: number
  outputPrompt: string
  tone: string
}

const contentAiSessions = pgTable("content_ai_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => contents.id, { onDelete: "cascade" }),
  invitationId: uuid("invitation_id")
    .notNull()
    .references(() => invitations.id, { onDelete: "cascade" }),
  overview: text("overview").notNull(),
  assistantConfigSnapshot: jsonb("assistant_config_snapshot")
    .$type<ContentAssistantConfigSnapshot>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

const contentAiSessionsRelations = relations(contentAiSessions, ({ one }) => ({
  content: one(contents, {
    fields: [contentAiSessions.contentId],
    references: [contents.id],
  }),
  invitation: one(invitations, {
    fields: [contentAiSessions.invitationId],
    references: [invitations.id],
  }),
}))

type ContentAiSession = typeof contentAiSessions.$inferSelect
type NewContentAiSession = typeof contentAiSessions.$inferInsert

export {
  contentAiSessions,
  contentAiSessionsRelations,
  type ContentAiSession,
  type ContentAssistantConfigSnapshot,
  type NewContentAiSession,
}
