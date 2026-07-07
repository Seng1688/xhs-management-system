"use client"

import { X } from "lucide-react"

import { InvitationForm } from "@/components/invitations/invitation-form"
import { useEscapeKey } from "@/hooks/use-escape-key"
import type { Invitation } from "@/lib/invitations"
import { Button } from "@workspace/ui/components/button"

type InvitationFormModalProps = {
  initialVisitDatetime?: string
  invitation: Invitation | null
  isOpen: boolean
  onCancel: () => void
  onSaved: () => void
}

function InvitationFormModal({
  initialVisitDatetime,
  invitation,
  isOpen,
  onCancel,
  onSaved,
}: InvitationFormModalProps) {
  useEscapeKey(onCancel, isOpen)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {invitation ? "Edit invitation" : "Add invitation"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Capture the key collaboration details before follow-up.
            </p>
          </div>
          <Button
            aria-label="Close invitation form"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4">
          <InvitationForm
            key={invitation?.id ?? initialVisitDatetime ?? "new-invitation"}
            initialVisitDatetime={initialVisitDatetime}
            invitation={invitation}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>
  )
}

export { InvitationFormModal }
