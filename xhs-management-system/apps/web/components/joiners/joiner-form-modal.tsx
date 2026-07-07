"use client"

import { Save, X } from "lucide-react"
import * as React from "react"

import {
  useCreateJoinerMutation,
  useUpdateJoinerMutation,
} from "@/hooks/use-joiners"
import { useEscapeKey } from "@/hooks/use-escape-key"
import type { Joiner, JoinerInput } from "@/lib/joiners"
import { Button } from "@workspace/ui/components/button"

type JoinerFormModalProps = {
  isOpen: boolean
  joiner: Joiner | null
  onCancel: () => void
  onSaved: () => void
}

function JoinerFormModal({
  isOpen,
  joiner,
  onCancel,
  onSaved,
}: JoinerFormModalProps) {
  const createMutation = useCreateJoinerMutation()
  const updateMutation = useUpdateJoinerMutation()
  const [form, setForm] = React.useState<JoinerInput>(() =>
    joiner ? formFromJoiner(joiner) : emptyForm
  )
  const isSaving = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error ?? updateMutation.error

  useEscapeKey(onCancel, isOpen)

  if (!isOpen) {
    return null
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (joiner) {
      updateMutation.mutate(
        {
          id: joiner.id,
          input: form,
        },
        {
          onSuccess: onSaved,
        }
      )
      return
    }

    createMutation.mutate(form, {
      onSuccess: onSaved,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {joiner ? "Edit joiner" : "Add joiner"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Email is the unique identity used for reminders.
            </p>
          </div>
          <Button
            aria-label="Close joiner form"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <form className="space-y-4 p-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            Name
            <input
              className={inputClassName}
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className={inputClassName}
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <input
              checked={form.sendEmail}
              className="mt-0.5 size-4 accent-primary"
              type="checkbox"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sendEmail: event.target.checked,
                }))
              }
            />
            <span className="space-y-1">
              <span className="block font-medium">Send reminder emails</span>
              <span className="block text-xs text-muted-foreground">
                When off, this joiner will not receive visit reminder emails.
              </span>
            </span>
          </label>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={isSaving} type="submit">
              <Save aria-hidden="true" />
              {isSaving ? "Saving..." : joiner ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const emptyForm: JoinerInput = {
  email: "",
  name: "",
  sendEmail: true,
}

function formFromJoiner(joiner: Joiner): JoinerInput {
  return {
    email: joiner.email,
    name: joiner.name,
    sendEmail: joiner.sendEmail,
  }
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export { JoinerFormModal }
