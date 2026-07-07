import { relations } from "drizzle-orm"
import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"

import { invitations } from "./invitations.js"

const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("contents_invitation_id_unique").on(table.invitationId)]
)

const contentsRelations = relations(contents, ({ one }) => ({
  invitation: one(invitations, {
    fields: [contents.invitationId],
    references: [invitations.id],
  }),
}))

type Content = typeof contents.$inferSelect
type NewContent = typeof contents.$inferInsert

export { contents, contentsRelations, type Content, type NewContent }
