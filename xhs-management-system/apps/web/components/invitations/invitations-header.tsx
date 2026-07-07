import { Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type InvitationsHeaderProps = {
  invitationCount: number
  onCreateNew: () => void
}

function InvitationsHeader({
  invitationCount,
  onCreateNew,
}: InvitationsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Creator CRM</p>
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-normal">
            Invitations
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Track collaboration invites, store visits, product exchanges, and
            next actions in one place.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {invitationCount} visible
        </span>
        <Button onClick={onCreateNew} type="button">
          <Plus aria-hidden="true" />
          New
        </Button>
      </div>
    </header>
  )
}

export { InvitationsHeader }
