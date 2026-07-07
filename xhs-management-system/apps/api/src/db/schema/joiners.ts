import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

const joiners = pgTable("joiner", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  sendEmail: boolean("send_email").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

type Joiner = typeof joiners.$inferSelect
type NewJoiner = typeof joiners.$inferInsert

export {
  joiners,
  type Joiner,
  type NewJoiner,
}
