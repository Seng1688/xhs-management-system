import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"

const contentAssistantSettings = pgTable("content_assistant_settings", {
  id: text("id").primaryKey(),
  language: text("language").notNull(),
  tone: text("tone").notNull(),
  minWords: integer("min_words").notNull(),
  maxWords: integer("max_words").notNull(),
  bannedWords: jsonb("banned_words").$type<string[]>().notNull().default([]),
  outputPrompt: text("output_prompt").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

type ContentAssistantSettings = typeof contentAssistantSettings.$inferSelect
type NewContentAssistantSettings = typeof contentAssistantSettings.$inferInsert

export {
  contentAssistantSettings,
  type ContentAssistantSettings,
  type NewContentAssistantSettings,
}
