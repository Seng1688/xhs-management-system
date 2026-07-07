"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

type CalendarToolbarProps = {
  currentMonth: Date
  onNextMonth: () => void
  onPreviousMonth: () => void
  onToday: () => void
}

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
})

function CalendarToolbar({
  currentMonth,
  onNextMonth,
  onPreviousMonth,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-heading text-lg font-semibold">
          {monthFormatter.format(currentMonth)}
        </p>
        <p className="text-xs text-muted-foreground">Month view</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous month"
          size="icon-sm"
          type="button"
          variant="outline"
          onClick={onPreviousMonth}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button
          aria-label="Next month"
          size="icon-sm"
          type="button"
          variant="outline"
          onClick={onNextMonth}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export { CalendarToolbar }
