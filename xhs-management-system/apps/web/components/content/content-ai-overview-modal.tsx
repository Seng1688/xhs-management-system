"use client"

import { Sparkles, X } from "lucide-react"
import * as React from "react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import { Button } from "@workspace/ui/components/button"

type ContentAiOverviewModalProps = {
  isGenerating: boolean
  shopName: string
  onClose: () => void
  onGenerate: (overview: string) => void
}

function ContentAiOverviewModal({
  isGenerating,
  onClose,
  onGenerate,
  shopName,
}: ContentAiOverviewModalProps) {
  const [overview, setOverview] = React.useState("")

  useEscapeKey(onClose, !isGenerating)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!overview.trim()) {
      return
    }

    onGenerate(overview.trim())
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <form
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              AI generate content
            </h2>
            <p className="text-sm text-muted-foreground">{shopName}</p>
          </div>
          <Button
            aria-label="Close AI overview"
            disabled={isGenerating}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          <label className="grid gap-2 text-sm font-medium">
            Overview
            <textarea
              className="min-h-72 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Paste the shop/service overview and your experience..."
              value={overview}
              onChange={(event) => setOverview(event.target.value)}
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border p-4">
          <Button disabled={isGenerating || !overview.trim()} type="submit">
            <Sparkles aria-hidden="true" />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export { ContentAiOverviewModal }
