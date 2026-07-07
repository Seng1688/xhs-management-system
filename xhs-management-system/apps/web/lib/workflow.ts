import type { Content } from "@/lib/content"
import type { Invitation } from "@/lib/invitations"

type WorkflowHint = {
  id: string
  label: string
}

const contentFollowUpDays = 5

function getMissingFieldHints(invitation: Invitation): WorkflowHint[] {
  const hints: WorkflowHint[] = []

  if (!invitation.visitDatetime) {
    hints.push({ id: "visitDatetime", label: "Missing visit date" })
  }

  if (!hasText(invitation.address)) {
    hints.push({ id: "address", label: "Missing address" })
  }

  if (!hasText(invitation.contactNumber)) {
    hints.push({ id: "contactNumber", label: "Missing contact" })
  }

  if (!hasText(invitation.compensation)) {
    hints.push({ id: "compensation", label: "Missing compensation" })
  }

  if (invitation.joiners.length === 0) {
    hints.push({ id: "joiners", label: "Missing joiners" })
  }

  return hints
}

function isVisitTomorrow(invitation: Invitation, now = new Date()) {
  if (invitation.status !== "Scheduled" || !invitation.visitDatetime) {
    return false
  }

  return toDateKey(new Date(invitation.visitDatetime)) === toDateKey(addDays(now, 1))
}

function isVisitToday(invitation: Invitation, now = new Date()) {
  if (invitation.status !== "Scheduled" || !invitation.visitDatetime) {
    return false
  }

  return toDateKey(new Date(invitation.visitDatetime)) === toDateKey(now)
}

function needsContentFollowUp(
  invitation: Pick<Invitation, "status" | "visitDatetime">,
  content: Content | null | undefined,
  now = new Date()
) {
  if (
    invitation.status !== "Completed" ||
    !invitation.visitDatetime ||
    hasContentDraft(content)
  ) {
    return false
  }

  return getDaysSince(invitation.visitDatetime, now) >= contentFollowUpDays
}

function hasContentDraft(content: Content | null | undefined) {
  if (!content) {
    return false
  }

  return (
    hasText(content.title) ||
    hasText(content.body) ||
    content.tags.some((tag) => hasText(tag))
  )
}

function getDaysSince(value: string, now = new Date()) {
  const date = new Date(value)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / millisecondsPerDay)
}

function formatRelativeDays(days: number) {
  if (days <= 0) {
    return "today"
  }

  if (days === 1) {
    return "1 day ago"
  }

  return `${days} days ago`
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export {
  contentFollowUpDays,
  formatRelativeDays,
  getDaysSince,
  getMissingFieldHints,
  hasContentDraft,
  isVisitToday,
  isVisitTomorrow,
  needsContentFollowUp,
  type WorkflowHint,
}
