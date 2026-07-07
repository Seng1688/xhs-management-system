import { and, eq, isNotNull } from "drizzle-orm"

import { db } from "../../db/client.js"
import {
  invitationJoiners,
  invitationReminderLogs,
  invitations,
  joiners,
  type Invitation,
} from "../../db/schema/index.js"

const DAY_BEFORE_VISIT_REMINDER = "day_before_visit"
const TIME_ZONE = "Asia/Kuala_Lumpur"
const N8N_VISIT_REMINDER_PATH = "visit-reminder"
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

type ReminderJoiner = {
  email: string
  id: string
  name: string
  sendEmail: boolean
}

type ReminderInvitation = Invitation & {
  joiners: ReminderJoiner[]
}

type VisitReminderResult = {
  failed: number
  sent: number
  skipped: number
}

async function sendDayBeforeVisitReminders(
  now = new Date()
): Promise<VisitReminderResult> {
  const visitDate = toDateKey(new Date(now.getTime() + ONE_DAY_IN_MS))
  const invitations = await listScheduledInvitationsByVisitDate(visitDate)
  const result: VisitReminderResult = {
    failed: 0,
    sent: 0,
    skipped: 0,
  }

  for (const invitation of invitations) {
    const emails = invitation.joiners
      .filter((joiner) => joiner.sendEmail)
      .map((joiner) => joiner.email)

    if (emails.length === 0) {
      result.skipped += 1
      continue
    }

    const alreadySent = await hasReminderLog(invitation.id, visitDate)

    if (alreadySent) {
      result.skipped += 1
      continue
    }

    try {
      await triggerVisitReminderWebhook(invitation, visitDate)
      await createReminderLog(invitation.id, visitDate)
      result.sent += 1
    } catch (error) {
      result.failed += 1
      console.warn(
        error instanceof Error
          ? error.message
          : "Day-before visit reminder failed with an unknown error"
      )
    }
  }

  return result
}

async function listScheduledInvitationsByVisitDate(visitDate: string) {
  const rows = await db
    .select({
      email: joiners.email,
      joinerId: joiners.id,
      invitation: invitations,
      joinerName: joiners.name,
      sendEmail: joiners.sendEmail,
    })
    .from(invitations)
    .innerJoin(
      invitationJoiners,
      eq(invitationJoiners.invitationId, invitations.id)
    )
    .innerJoin(joiners, eq(invitationJoiners.joinerId, joiners.id))
    .where(
      and(
        eq(invitations.status, "Scheduled"),
        isNotNull(invitations.visitDatetime)
      )
    )

  const invitationsById = new Map<string, ReminderInvitation>()

  for (const row of rows) {
    if (!row.invitation.visitDatetime) {
      continue
    }

    if (toDateKey(row.invitation.visitDatetime) !== visitDate) {
      continue
    }

    const invitation = invitationsById.get(row.invitation.id) ?? {
      ...row.invitation,
      joiners: [],
    }

    invitation.joiners.push({
      email: row.email,
      id: row.joinerId,
      name: row.joinerName,
      sendEmail: row.sendEmail,
    })
    invitationsById.set(invitation.id, invitation)
  }

  return Array.from(invitationsById.values())
}

async function hasReminderLog(invitationId: string, visitDate: string) {
  const [log] = await db
    .select({ id: invitationReminderLogs.id })
    .from(invitationReminderLogs)
    .where(
      and(
        eq(invitationReminderLogs.invitationId, invitationId),
        eq(invitationReminderLogs.reminderType, DAY_BEFORE_VISIT_REMINDER),
        eq(invitationReminderLogs.visitDate, visitDate)
      )
    )
    .limit(1)

  return Boolean(log)
}

async function createReminderLog(invitationId: string, visitDate: string) {
  await db
    .insert(invitationReminderLogs)
    .values({
      invitationId,
      reminderType: DAY_BEFORE_VISIT_REMINDER,
      visitDate,
    })
    .onConflictDoNothing()
}

async function triggerVisitReminderWebhook(
  invitation: ReminderInvitation,
  visitDate: string
) {
  const webhookUrl = getReminderWebhookUrl()

  if (!webhookUrl) {
    throw new Error("n8n reminder webhook is not configured.")
  }

  const response = await fetch(webhookUrl, {
    body: JSON.stringify({
      event: "visit.reminder.day_before",
      invitation: {
        address: invitation.address,
        compensation: invitation.compensation,
        contactName: invitation.contactName,
        contactNumber: invitation.contactNumber,
        contactRole: invitation.contactRole,
        id: invitation.id,
        remarks: invitation.remarks,
        shopName: invitation.shopName,
        status: invitation.status,
        visitDateFormatted: invitation.visitDatetime
          ? formatVisitDate(invitation.visitDatetime)
          : null,
        visitDatetime: invitation.visitDatetime?.toISOString() ?? null,
        visitDatetimeFormatted: invitation.visitDatetime
          ? formatVisitDatetime(invitation.visitDatetime)
          : null,
        visitTimeFormatted: invitation.visitDatetime
          ? formatVisitTime(invitation.visitDatetime)
          : null,
        visitType: invitation.visitType,
      },
      joiners: invitation.joiners,
      recipients: invitation.joiners
        .filter((joiner) => joiner.sendEmail)
        .map((joiner) => joiner.email),
      sentAt: new Date().toISOString(),
      timeZone: TIME_ZONE,
      visitDate,
    }),
    headers: buildN8nHeaders(),
    method: "POST",
    signal: AbortSignal.timeout(getTimeoutMs()),
  })

  if (!response.ok) {
    throw new Error(`n8n reminder webhook failed with ${response.status}`)
  }
}

function getReminderWebhookUrl() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim()

  if (!webhookUrl) {
    return null
  }

  return new URL(
    N8N_VISIT_REMINDER_PATH,
    webhookUrl.endsWith("/") ? webhookUrl : `${webhookUrl}/`
  ).toString()
}

function buildN8nHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (process.env.N8N_AUTH) {
    headers["X-API-KEY"] = process.env.N8N_AUTH
  }

  return headers
}

function getTimeoutMs() {
  const rawTimeout = Number(process.env.N8N_SHOP_SEARCH_TIMEOUT_MS)

  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 15000
}

function formatVisitDatetime(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).format(date)
}

function formatVisitDate(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).format(date)
}

function formatVisitTime(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date)
}

function toDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).formatToParts(date)

  const day = parts.find((part) => part.type === "day")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const year = parts.find((part) => part.type === "year")?.value

  if (!day || !month || !year) {
    throw new Error("Unable to format reminder date.")
  }

  return `${year}-${month}-${day}`
}

export { sendDayBeforeVisitReminders }
