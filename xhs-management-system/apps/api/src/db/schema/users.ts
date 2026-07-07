import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

type User = typeof users.$inferSelect
type NewUser = typeof users.$inferInsert

export { users, type NewUser, type User }
