import { unique, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { invitations } from "./invitations.js"

const invitationReminderLogs = pgTable(
  "invitation_reminder_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    reminderType: text("reminder_type").notNull(),
    visitDate: text("visit_date").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("invitation_reminder_logs_invitation_type_date_unique").on(
      table.invitationId,
      table.reminderType,
      table.visitDate
    ),
  ]
)

type InvitationReminderLog = typeof invitationReminderLogs.$inferSelect
type NewInvitationReminderLog = typeof invitationReminderLogs.$inferInsert

export {
  invitationReminderLogs,
  type InvitationReminderLog,
  type NewInvitationReminderLog,
}
