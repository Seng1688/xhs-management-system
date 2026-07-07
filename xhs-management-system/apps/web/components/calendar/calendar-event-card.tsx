"use client"

import { Clock, UsersRound, X } from "lucide-react"

import { getInvitationStatusClassName } from "@/lib/invitation-status-styles"
import type { Invitation } from "@/lib/invitations"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type CalendarEventCardProps = {
  invitation: Invitation
  onDelete: (invitation: Invitation) => void
  onEdit: (invitation: Invitation) => void
}

const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
})

function CalendarEventCard({
  invitation,
  onDelete,
  onEdit,
}: CalendarEventCardProps) {
  const visitDate = invitation.visitDatetime
    ? new Date(invitation.visitDatetime)
    : null

  return (
    <div
      className={cn(
        "group/event relative rounded-md border text-[11px] leading-tight transition-colors hover:ring-2 hover:ring-ring/30",
        getInvitationStatusClassName(invitation.status)
      )}
    >
      <button
        className="w-full px-1.5 py-1 pr-7 text-left"
        type="button"
        onClick={() => onEdit(invitation)}
      >
        <span className="block truncate font-medium">
          {invitation.shopName}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 opacity-85">
          {visitDate ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-2.5" aria-hidden="true" />
              {timeFormatter.format(visitDate)}
            </span>
          ) : null}
          {invitation.joiners.length > 0 ? (
            <span className="inline-flex items-center gap-1 truncate">
              <UsersRound className="size-2.5" aria-hidden="true" />
              {invitation.joiners.map((joiner) => joiner.name).join(", ")}
            </span>
          ) : null}
        </span>
      </button>
      <Button
        aria-label={`Delete ${invitation.shopName}`}
        className="absolute right-1 top-1 size-5 rounded-md opacity-70 hover:opacity-100"
        size="icon-xs"
        type="button"
        variant="ghost"
        onClick={() => onDelete(invitation)}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  )
}

export { CalendarEventCard }
