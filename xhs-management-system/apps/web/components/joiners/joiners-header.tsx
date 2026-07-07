"use client"

import { Plus } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type JoinersHeaderProps = {
  joinerCount: number
  onCreateNew: () => void
}

function JoinersHeader({ joinerCount, onCreateNew }: JoinersHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Creator CRM</p>
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-normal">
            Joiners
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Manage people who can join visits and receive visit reminder emails.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {joinerCount} joiners
        </div>
        <Button type="button" onClick={onCreateNew}>
          <Plus aria-hidden="true" />
          Add joiner
        </Button>
      </div>
    </header>
  )
}

export { JoinersHeader }
