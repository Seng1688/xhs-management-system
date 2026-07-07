import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core"

import { invitations } from "./invitations.js"
import { joiners } from "./joiners.js"

const invitationJoiners = pgTable(
  "invitation_joiners",
  {
    invitationId: uuid("invitation_id")
      .notNull()
      .references(() => invitations.id, { onDelete: "cascade" }),
    joinerId: uuid("joiner_id")
      .notNull()
      .references(() => joiners.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.invitationId, table.joinerId] })]
)

type InvitationJoiner = typeof invitationJoiners.$inferSelect
type NewInvitationJoiner = typeof invitationJoiners.$inferInsert

export {
  invitationJoiners,
  type InvitationJoiner,
  type NewInvitationJoiner,
}
