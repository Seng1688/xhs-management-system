"use client"

import { Bot, Clipboard, Save, X } from "lucide-react"
import * as React from "react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import type { Content, ContentInput, ContentInvitationItem } from "@/lib/content"
import { Button } from "@workspace/ui/components/button"
import { useToast } from "@workspace/ui/components/toast"

type ContentEditorModalProps = {
  content: Content
  invitation: ContentInvitationItem["invitation"]
  isSaving: boolean
  onAiGenerate: () => void
  onClose: () => void
  onSave: (input: ContentInput) => void
}

function ContentEditorModal({
  content,
  invitation,
  isSaving,
  onAiGenerate,
  onClose,
  onSave,
}: ContentEditorModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = React.useState(content.title)
  const [body, setBody] = React.useState(content.body)
  const [tagsText, setTagsText] = React.useState(content.tags.join(" "))

  useEscapeKey(onClose)

  const tags = parseTags(tagsText)
  const postText = formatPost({ body, tags, title })

  function copyPost() {
    void navigator.clipboard.writeText(postText)
    toast({ title: "Post copied", variant: "success" })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Edit content
            </h2>
            <p className="text-sm text-muted-foreground">
              {invitation.shopName}
            </p>
          </div>
          <Button
            aria-label="Close content editor"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={copyPost}>
              <Clipboard aria-hidden="true" />
              Copy post
            </Button>
            <Button type="button" variant="outline" onClick={onAiGenerate}>
              <Bot aria-hidden="true" />
              AI Generate
            </Button>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Title
            <input
              className={inputClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Body
            <textarea
              className={textAreaClassName}
              rows={15}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Tags
            <textarea
              className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="#tag1 #tag2 #tag3"
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border p-4">
          <Button
            disabled={isSaving}
            type="button"
            onClick={() => onSave({ body, tags, title })}
          >
            <Save aria-hidden="true" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function parseTags(value: string) {
  return value
    .split(/[\s,，]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
}

function formatPost({ body, tags, title }: ContentInput) {
  return [title, body, tags.join(" ")].filter(Boolean).join("\n\n")
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const textAreaClassName =
  "w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export { ContentEditorModal }
