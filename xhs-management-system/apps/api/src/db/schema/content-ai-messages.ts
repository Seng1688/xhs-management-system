import { relations } from "drizzle-orm"
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { contentAiSessions } from "./content-ai-sessions.js"

const contentAiMessageRoles = ["user", "assistant"] as const
const contentAiMessageRoleEnum = pgEnum(
  "content_ai_message_role",
  contentAiMessageRoles
)

type ContentChangeSummary = {
  body: string[]
  tags: string[]
  title: string[]
}

const contentAiMessages = pgTable("content_ai_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => contentAiSessions.id, { onDelete: "cascade" }),
  role: contentAiMessageRoleEnum("role").notNull(),
  message: text("message").notNull(),
  generatedTitle: text("generated_title"),
  generatedBody: text("generated_body"),
  generatedTags: jsonb("generated_tags").$type<string[]>(),
  changeSummary: jsonb("change_summary").$type<ContentChangeSummary>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

const contentAiMessagesRelations = relations(contentAiMessages, ({ one }) => ({
  session: one(contentAiSessions, {
    fields: [contentAiMessages.sessionId],
    references: [contentAiSessions.id],
  }),
}))

type ContentAiMessageRole = (typeof contentAiMessageRoles)[number]
type ContentAiMessage = typeof contentAiMessages.$inferSelect
type NewContentAiMessage = typeof contentAiMessages.$inferInsert

export {
  contentAiMessageRoleEnum,
  contentAiMessageRoles,
  contentAiMessages,
  contentAiMessagesRelations,
  type ContentAiMessage,
  type ContentAiMessageRole,
  type ContentChangeSummary,
  type NewContentAiMessage,
}
