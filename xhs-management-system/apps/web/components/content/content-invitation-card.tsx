"use client"

import { Bot, CalendarClock, Edit3 } from "lucide-react"

import { getInvitationStatusClassName } from "@/lib/invitation-status-styles"
import type { ContentInvitationItem } from "@/lib/content"
import { Button } from "@workspace/ui/components/button"

type ContentInvitationCardProps = {
  item: ContentInvitationItem
  onAiGenerate: (item: ContentInvitationItem) => void
  onEdit: (item: ContentInvitationItem) => void
}

function ContentInvitationCard({
  item,
  onAiGenerate,
  onEdit,
}: ContentInvitationCardProps) {
  const hasContent = Boolean(
    item.content?.title || item.content?.body || item.content?.tags.length
  )

  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-heading text-lg font-semibold">
              {item.invitation.shopName}
            </h2>
            <span
              className={getInvitationStatusClassName(
                item.invitation.status,
                "rounded-md border px-2 py-0.5 text-xs font-medium"
              )}
            >
              {item.invitation.status}
            </span>
            <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {hasContent ? "Drafted" : "Empty"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{item.invitation.visitType}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-4" aria-hidden="true" />
              {formatVisitDate(item.invitation.visitDatetime)}
            </span>
          </div>

          {item.content?.title ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {item.content.title}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" onClick={() => onEdit(item)}>
            <Edit3 aria-hidden="true" />
            Edit
          </Button>
          <Button type="button" onClick={() => onAiGenerate(item)}>
            <Bot aria-hidden="true" />
            AI Generate
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatVisitDate(value: string | null) {
  if (!value) {
    return "Not scheduled"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export { ContentInvitationCard }
