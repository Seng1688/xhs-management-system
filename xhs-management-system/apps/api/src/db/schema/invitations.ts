import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

const visitTypes = ["F&B", "Service", "Product"] as const
const contactRoles = ["Agent", "Owner", "Other"] as const
const invitationStatuses = [
  "Pending Review",
  "Scheduled",
  "Completed",
  "Declined",
] as const

const visitTypeEnum = pgEnum("visit_type", visitTypes)
const contactRoleEnum = pgEnum("contact_role", contactRoles)
const invitationStatusEnum = pgEnum("invitation_status", invitationStatuses)

const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopName: text("shop_name").notNull(),
  visitType: visitTypeEnum("visit_type").notNull(),
  address: text("address"),
  contactName: text("contact_name"),
  contactRole: contactRoleEnum("contact_role"),
  contactNumber: text("contact_number"),
  status: invitationStatusEnum("status").default("Pending Review").notNull(),
  visitDatetime: timestamp("visit_datetime", { withTimezone: true }),
  compensation: text("compensation"),
  remarks: text("remarks"),
  rawTextBackup: text("raw_text_backup"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

type VisitType = (typeof visitTypes)[number]
type ContactRole = (typeof contactRoles)[number]
type InvitationStatus = (typeof invitationStatuses)[number]
type Invitation = typeof invitations.$inferSelect
type NewInvitation = typeof invitations.$inferInsert

export {
  contactRoleEnum,
  contactRoles,
  invitationStatusEnum,
  invitationStatuses,
  invitations,
  visitTypeEnum,
  visitTypes,
  type ContactRole,
  type Invitation,
  type InvitationStatus,
  type NewInvitation,
  type VisitType,
}
