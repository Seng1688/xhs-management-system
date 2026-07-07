"use client"

import { Sparkles, X } from "lucide-react"
import * as React from "react"

import { AiProgressTracker } from "@/components/invitations/ai-progress-tracker"
import { useEscapeKey } from "@/hooks/use-escape-key"
import type { ShopEnrichment } from "@/lib/ai"
import { Button } from "@workspace/ui/components/button"

type AiGenerateModalProps = {
  error?: string
  isComplete?: boolean
  isGenerating: boolean
  onClose: () => void
  onGenerate: (input: {
    additionalPrompt?: string
    rawText: string
  }) => void
  rawText: string
  shopEnrichment?: ShopEnrichment | null
}

function AiGenerateModal({
  error,
  isComplete = false,
  isGenerating,
  onClose,
  onGenerate,
  rawText,
  shopEnrichment,
}: AiGenerateModalProps) {
  const [draftRawText, setDraftRawText] = React.useState(rawText)
  const [additionalPrompt, setAdditionalPrompt] = React.useState("contact name: shop name by default \ncontact role: agent by default \njoiner: sam and 恩恩 by default \ncontact number : - by default\nvisit date/time: \nremarks: include signature food if provided")
  const [hasGeoPhaseStarted, setHasGeoPhaseStarted] = React.useState(false)

  useEscapeKey(onClose, !isGenerating)

  React.useEffect(() => {
    if (!isGenerating) {
      return
    }

    const timeout = window.setTimeout(() => {
      setHasGeoPhaseStarted(true)
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [isGenerating])

  const progressPhase: "ai" | "geo" | "idle" = isGenerating
    ? hasGeoPhaseStarted
      ? "geo"
      : "ai"
    : isComplete
      ? "geo"
      : "idle"

  const shouldShowProgress =
    isGenerating || isComplete || Boolean(error) || progressPhase !== "idle"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">AI Generate</h3>
            <p className="text-sm text-muted-foreground">
              Paste the XHS invitation text. Regenerate with extra instructions
              if the draft needs refinement.
            </p>
          </div>
          <Button
            aria-label="Close AI generate"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        {shouldShowProgress ? (
          <AiProgressTracker
            error={error}
            isComplete={isComplete}
            isGenerating={isGenerating}
            phase={progressPhase}
            shopEnrichmentStatus={shopEnrichment?.status}
          />
        ) : null}

        <div className="min-h-0 space-y-4 overflow-y-auto p-4">
          <label className="grid gap-2 text-sm font-medium">
            XHS raw invitation text
            <textarea
              className="min-h-44 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={draftRawText}
              onChange={(event) => setDraftRawText(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Additional prompt
            <textarea
              className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Optional: refine the previous draft, find address, make compensation shorter..."
              value={additionalPrompt}
              onChange={(event) => setAdditionalPrompt(event.target.value)}
            />
          </label>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isGenerating || draftRawText.trim().length === 0}
            type="button"
            onClick={() =>
              {
                setHasGeoPhaseStarted(false)
                onGenerate({
                  additionalPrompt,
                  rawText: draftRawText,
                })
              }
            }
          >
            <Sparkles aria-hidden="true" />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { AiGenerateModal }
