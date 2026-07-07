"use client"

import { ExternalLink, MapPin, Search, X } from "lucide-react"
import * as React from "react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import { useShopSearchMutation } from "@/hooks/use-shop-search"
import type { ShopSearchResult } from "@/lib/shop-search"
import { Button } from "@workspace/ui/components/button"

type ShopSearchModalProps = {
  initialNear: string
  initialQuery: string
  onClose: () => void
  onSelect: (result: ShopSearchResult) => void
}

function ShopSearchModal({
  initialNear,
  initialQuery,
  onClose,
  onSelect,
}: ShopSearchModalProps) {
  const searchMutation = useShopSearchMutation()
  const [query, setQuery] = React.useState(initialQuery)
  const [near, setNear] = React.useState(initialNear)

  useEscapeKey(onClose, !searchMutation.isPending)

  function onSearch() {
    if (query.trim().length < 2) {
      return
    }

    searchMutation.mutate({
      near: near.trim() || undefined,
      query: query.trim(),
    })
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onSearch()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              Search shop details
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick the correct result to fill shop name and address.
            </p>
          </div>
          <Button
            aria-label="Close shop search"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div
          className="grid shrink-0 gap-3 border-b border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
        >
          <label className="grid gap-2 text-sm font-medium">
            Shop name
            <input
              className={inputClassName}
              minLength={2}
              required
              value={query}
              onKeyDown={onInputKeyDown}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Near / area
            <input
              className={inputClassName}
              placeholder="Optional area, mall, city..."
              value={near}
              onKeyDown={onInputKeyDown}
              onChange={(event) => setNear(event.target.value)}
            />
          </label>

          <Button
            className="self-end"
            disabled={searchMutation.isPending || query.trim().length < 2}
            type="button"
            onClick={onSearch}
          >
            <Search aria-hidden="true" />
            {searchMutation.isPending ? "Searching..." : "Search"}
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {searchMutation.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {searchMutation.error.message}
            </p>
          ) : null}

          {searchMutation.data?.results.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              No matching shops found. Try adding an area or branch name.
            </p>
          ) : null}

          <div className="grid gap-3">
            {searchMutation.data?.results.map((result) => (
              <div
                key={result.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{result.name}</p>
                    <p className="flex gap-1.5 text-sm text-muted-foreground">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span>{result.address}</span>
                    </p>
                    {result.category ? (
                      <p className="text-xs text-muted-foreground">
                        {result.category}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      asChild
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <a
                        href={result.sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" />
                        Open
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => onSelect(result)}
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

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export { ShopSearchModal }
