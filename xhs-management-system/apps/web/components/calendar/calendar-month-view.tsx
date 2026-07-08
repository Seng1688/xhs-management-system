"use client"

import { CalendarClock, Plus, X } from "lucide-react"
import * as React from "react"

import { CalendarEventCard } from "@/components/calendar/calendar-event-card"
import { Button } from "@workspace/ui/components/button"
import type { Invitation } from "@/lib/invitations"
import { cn } from "@workspace/ui/lib/utils"

type CalendarMonthViewProps = {
  currentMonth: Date
  invitations: Invitation[]
  isLoading: boolean
  onCreateInvitation: (date: Date) => void
  onDeleteInvitation: (invitation: Invitation) => void
  onEditInvitation: (invitation: Invitation) => void
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function CalendarMonthView({
  currentMonth,
  invitations,
  isLoading,
  onCreateInvitation,
  onDeleteInvitation,
  onEditInvitation,
}: CalendarMonthViewProps) {
  const days = React.useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  )
  const invitationsByDate = React.useMemo(
    () => groupInvitationsByDate(invitations),
    [invitations]
  )
  const todayKey = toDateKey(new Date())
  const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    setSelectedDateKey(null)
  }, [currentMonth])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        Loading calendar...
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-muted/60 text-center text-xs font-medium uppercase text-muted-foreground">
        {weekdayLabels.map((weekday) => (
          <div key={weekday} className="px-2 py-2">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 sm:hidden">
        {days.map((day) => {
          const dateKey = toDateKey(day.date)
          const dayInvitations = invitationsByDate.get(dateKey) ?? []
          const isSelected = selectedDateKey === dateKey

          return (
            <button
              key={dateKey}
              className={cn(
                "relative min-h-16 border-b border-r border-border p-1.5 text-left transition-colors",
                !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                dateKey === todayKey && "bg-primary/5",
                isSelected && "bg-muted ring-2 ring-inset ring-ring/40"
              )}
              type="button"
              onClick={() => setSelectedDateKey(dateKey)}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md text-xs font-medium",
                  dateKey === todayKey && "bg-primary text-primary-foreground"
                )}
              >
                {day.date.getDate()}
              </span>
              {dayInvitations.length > 0 ? (
                <span className="absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-12px)] items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="truncate text-[10px] font-medium text-muted-foreground">
                    {dayInvitations.length}
                  </span>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="hidden grid-cols-7 sm:grid">
        {days.map((day) => {
          const dateKey = toDateKey(day.date)
          const dayInvitations = invitationsByDate.get(dateKey) ?? []

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-28 border-b border-border p-1.5 sm:border-r",
                !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                dateKey === todayKey && "bg-primary/5"
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-md text-xs font-medium",
                    dateKey === todayKey && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.date.getDate()}
                </span>
                <span className="flex items-center gap-1">
                  {dayInvitations.length > 0 ? (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {dayInvitations.length}
                    </span>
                  ) : null}
                  <Button
                    aria-label={`Add invitation on ${dateKey}`}
                    className="size-6 rounded-md"
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                    onClick={() => onCreateInvitation(day.date)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                </span>
              </div>

              <div className="space-y-1">
                {dayInvitations.map((invitation) => (
                  <CalendarEventCard
                    key={invitation.id}
                    invitation={invitation}
                    onDelete={onDeleteInvitation}
                    onEdit={onEditInvitation}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDateKey ? (
        <MobileDaySheet
          date={getDateByKey(days, selectedDateKey)}
          invitations={invitationsByDate.get(selectedDateKey) ?? []}
          onClose={() => setSelectedDateKey(null)}
          onCreateInvitation={onCreateInvitation}
          onDeleteInvitation={onDeleteInvitation}
          onEditInvitation={onEditInvitation}
        />
      ) : null}
    </div>
  )
}

function MobileDaySheet({
  date,
  invitations,
  onClose,
  onCreateInvitation,
  onDeleteInvitation,
  onEditInvitation,
}: {
  date: Date
  invitations: Invitation[]
  onClose: () => void
  onCreateInvitation: (date: Date) => void
  onDeleteInvitation: (invitation: Invitation) => void
  onEditInvitation: (invitation: Invitation) => void
}) {
  return (
    <div className="fixed inset-0 z-40 sm:hidden">
      <button
        aria-label="Close day details"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        type="button"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {weekdayFormatter.format(date)}
            </p>
            <h2 className="font-heading text-xl font-semibold">
              {daySheetDateFormatter.format(date)}
            </h2>
          </div>
          <Button
            aria-label="Close day details"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="max-h-[calc(80vh-132px)] overflow-y-auto p-4">
          {invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <CalendarEventCard
                  key={invitation.id}
                  invitation={invitation}
                  onDelete={onDeleteInvitation}
                  onEdit={onEditInvitation}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <CalendarClock className="mx-auto mb-2 size-5" aria-hidden="true" />
              No visits scheduled for this date.
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button
            className="w-full"
            type="button"
            onClick={() => {
              onCreateInvitation(date)
              onClose()
            }}
          >
            <Plus aria-hidden="true" />
            Add invitation
          </Button>
        </div>
      </div>
    </div>
  )
}

function getCalendarDays(currentMonth: Date) {
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  )
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)

    return {
      date,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
    }
  })
}

function groupInvitationsByDate(invitations: Invitation[]) {
  const grouped = new Map<string, Invitation[]>()

  for (const invitation of invitations) {
    if (!invitation.visitDatetime) {
      continue
    }

    const dateKey = toDateKey(new Date(invitation.visitDatetime))
    const items = grouped.get(dateKey) ?? []

    grouped.set(dateKey, [...items, invitation])
  }

  for (const [dateKey, items] of grouped) {
    grouped.set(
      dateKey,
      [...items].sort((first, second) =>
        String(first.visitDatetime).localeCompare(String(second.visitDatetime))
      )
    )
  }

  return grouped
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getDateByKey(days: ReturnType<typeof getCalendarDays>, dateKey: string) {
  return days.find((day) => toDateKey(day.date) === dateKey)?.date ?? new Date()
}

const weekdayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "long",
})

const daySheetDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export { CalendarMonthView }
