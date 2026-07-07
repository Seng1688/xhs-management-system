"use client"

import { Plus } from "lucide-react"
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

      <div className="grid grid-cols-1 sm:grid-cols-7">
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

export { CalendarMonthView }
