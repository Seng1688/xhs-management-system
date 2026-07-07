"use client"

import { ExternalLink, MapPin, X } from "lucide-react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import type { ShopCandidate } from "@/lib/ai"
import { Button } from "@workspace/ui/components/button"

type ShopCandidateModalProps = {
  candidates: ShopCandidate[]
  onClose: () => void
  onSelect: (candidate: ShopCandidate) => void
}

function ShopCandidateModal({
  candidates,
  onClose,
  onSelect,
}: ShopCandidateModalProps) {
  useEscapeKey(onClose, true)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              Choose shop details
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick the matching shop to fill shop name and address.
            </p>
          </div>
          <Button
            aria-label="Close shop suggestions"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{candidate.name}</p>
                      {candidate.confidence !== null ? (
                        <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground">
                          {Math.round(candidate.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                    <p className="flex gap-1.5 text-sm text-muted-foreground">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span>{candidate.address}</span>
                    </p>
                    {candidate.source ? (
                      <p className="text-xs text-muted-foreground">
                        {candidate.source}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {candidate.sourceUrl ? (
                      <Button
                        asChild
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <a
                          href={candidate.sourceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden="true" />
                          Open
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => onSelect(candidate)}
                    >
                      Use this
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ShopCandidateModal }
