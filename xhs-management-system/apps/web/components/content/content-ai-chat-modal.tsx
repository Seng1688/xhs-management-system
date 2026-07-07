"use client"

import { RotateCcw, Save, Send, X } from "lucide-react"
import * as React from "react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import type {
  ContentAiMessage,
  ContentAiSession,
  ContentInput,
} from "@/lib/content"
import { Button } from "@workspace/ui/components/button"

type ContentAiChatModalProps = {
  isSending: boolean
  session: ContentAiSession
  shopName: string
  onClose: () => void
  onFreshSession: () => void
  onSave: (input: ContentInput) => void
  onSend: (message: string) => void
}

function ContentAiChatModal({
  isSending,
  onClose,
  onFreshSession,
  onSave,
  onSend,
  session,
  shopName,
}: ContentAiChatModalProps) {
  const [message, setMessage] = React.useState("")

  useEscapeKey(onClose, !isSending)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!message.trim()) {
      return
    }

    onSend(message.trim())
    setMessage("")
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">AI session</h2>
            <p className="text-sm text-muted-foreground">{shopName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={isSending}
              type="button"
              variant="outline"
              onClick={onFreshSession}
            >
              <RotateCcw aria-hidden="true" />
              Fresh session
            </Button>
            <Button
              aria-label="Close AI session"
              disabled={isSending}
              size="icon-sm"
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {session.messages.map((item) => (
            <ContentAiBubble
              key={item.id}
              message={item}
              onSave={onSave}
            />
          ))}
        </div>

        <form
          className="flex shrink-0 flex-col gap-3 border-t border-border p-4"
          onSubmit={handleSubmit}
        >
          <textarea
            className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Ask AI to refine the draft..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex justify-end">
            <Button disabled={isSending || !message.trim()} type="submit">
              <Send aria-hidden="true" />
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContentAiBubble({
  message,
  onSave,
}: {
  message: ContentAiMessage
  onSave: (input: ContentInput) => void
}) {
  const isAssistant = message.role === "assistant"

  if (!isAssistant) {
    return (
      <div className="ml-auto max-w-[82%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
        <p className="whitespace-pre-wrap">{message.message}</p>
      </div>
    )
  }

  const canSave = Boolean(
    message.generatedTitle && message.generatedBody && message.generatedTags
  )
  const changes = getChangeGroups(message)

  return (
    <div className="mr-auto max-w-[92%] space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
      {canSave ? (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Title
            </p>
            <p className="font-medium">{message.generatedTitle}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Content
            </p>
            <p className="whitespace-pre-wrap">{message.generatedBody}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Tags
            </p>
            <p className="break-words">{message.generatedTags?.join(" ")}</p>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{message.message}</p>
      )}

      {changes.length ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <p className="mb-2 text-xs font-medium uppercase text-primary">
            Changes
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {changes.map((change) => (
              <ChangeList
                key={change.label}
                label={change.label}
                items={change.items}
              />
            ))}
          </div>
        </div>
      ) : null}

      {canSave ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() =>
              onSave({
                body: message.generatedBody ?? "",
                tags: message.generatedTags ?? [],
                title: message.generatedTitle ?? "",
              })
            }
          >
            <Save aria-hidden="true" />
            Save changes
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ChangeList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-emerald-700">
      <p className="mb-1 font-medium">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}

function getChangeGroups(message: ContentAiMessage) {
  if (!message.changeSummary) {
    return []
  }

  return [
    { items: message.changeSummary.title, label: "Title" },
    { items: message.changeSummary.body, label: "Content" },
    { items: message.changeSummary.tags, label: "Tags" },
  ].filter((change) => change.items.length > 0)
}

export { ContentAiChatModal }
