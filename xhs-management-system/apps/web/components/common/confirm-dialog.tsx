"use client"

import { AlertTriangle, X } from "lucide-react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import { Button } from "@workspace/ui/components/button"

type ConfirmDialogProps = {
  confirmLabel?: string
  description: string
  isConfirming?: boolean
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

function ConfirmDialog({
  confirmLabel = "Delete",
  description,
  isConfirming,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  useEscapeKey(onCancel, isOpen && !isConfirming)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="flex gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <Button
            aria-label="Close confirmation"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="flex justify-end gap-2 p-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={isConfirming}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {isConfirming ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { ConfirmDialog }
