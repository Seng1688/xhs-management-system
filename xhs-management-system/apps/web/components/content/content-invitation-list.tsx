"use client"

import { ContentInvitationCard } from "@/components/content/content-invitation-card"
import type { ContentInvitationItem } from "@/lib/content"

type ContentInvitationListProps = {
  isLoading: boolean
  items: ContentInvitationItem[]
  onAiGenerate: (item: ContentInvitationItem) => void
  onEdit: (item: ContentInvitationItem) => void
}

function ContentInvitationList({
  isLoading,
  items,
  onAiGenerate,
  onEdit,
}: ContentInvitationListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Loading content invitations...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        No invitations are ready for content yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <ContentInvitationCard
          key={item.invitation.id}
          item={item}
          onAiGenerate={onAiGenerate}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

export { ContentInvitationList }
