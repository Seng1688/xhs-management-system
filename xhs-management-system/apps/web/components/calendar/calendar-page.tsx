"use client"

import * as React from "react"

import { CalendarMonthView } from "@/components/calendar/calendar-month-view"
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { InvitationFormModal } from "@/components/invitations/invitation-form-modal"
import {
  useDeleteInvitationMutation,
  useInvitations,
} from "@/hooks/use-invitations"
import type { Invitation } from "@/lib/invitations"

function CalendarPage() {
  const [currentMonth, setCurrentMonth] = React.useState(() =>
    startOfMonth(new Date())
  )
  const [creatingVisitDatetime, setCreatingVisitDatetime] =
    React.useState<string | null>(null)
  const [deletingInvitation, setDeletingInvitation] =
    React.useState<Invitation | null>(null)
  const [editingInvitation, setEditingInvitation] =
    React.useState<Invitation | null>(null)

  const deleteMutation = useDeleteInvitationMutation()
  const invitationsQuery = useInvitations({
    search: "",
    status: "all",
    visitType: "all",
  })
  const invitations = invitationsQuery.data?.invitations ?? []
  const scheduledInvitations = invitations.filter(
    (invitation) => invitation.visitDatetime
  )

  function goToPreviousMonth() {
    setCurrentMonth((month) => addMonths(month, -1))
  }

  function goToNextMonth() {
    setCurrentMonth((month) => addMonths(month, 1))
  }

  function goToToday() {
    setCurrentMonth(startOfMonth(new Date()))
  }

  function closeEditModal() {
    setEditingInvitation(null)
  }

  function openCreateModal(date: Date) {
    setCreatingVisitDatetime(toDatetimeLocalValue(date))
  }

  function closeCreateModal() {
    setCreatingVisitDatetime(null)
  }

  function confirmDeleteInvitation() {
    if (!deletingInvitation) {
      return
    }

    deleteMutation.mutate(deletingInvitation.id, {
      onSuccess: () => setDeletingInvitation(null),
    })
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Creator CRM</p>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-normal">
              Calendar
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              See scheduled visits from invitations by month and open any item
              to update the collaboration details.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {scheduledInvitations.length} scheduled
        </div>
      </header>

      <section className="space-y-4">
        <CalendarToolbar
          currentMonth={currentMonth}
          onNextMonth={goToNextMonth}
          onPreviousMonth={goToPreviousMonth}
          onToday={goToToday}
        />
        <CalendarMonthView
          currentMonth={currentMonth}
          invitations={scheduledInvitations}
          isLoading={invitationsQuery.isLoading}
          onCreateInvitation={openCreateModal}
          onDeleteInvitation={setDeletingInvitation}
          onEditInvitation={setEditingInvitation}
        />
      </section>

      <ConfirmDialog
        description={
          deletingInvitation
            ? `Delete ${deletingInvitation.shopName}? This cannot be undone.`
            : ""
        }
        isConfirming={deleteMutation.isPending}
        isOpen={deletingInvitation !== null}
        title="Delete invitation"
        onCancel={() => setDeletingInvitation(null)}
        onConfirm={confirmDeleteInvitation}
      />

      <InvitationFormModal
        initialVisitDatetime={creatingVisitDatetime ?? undefined}
        invitation={null}
        isOpen={creatingVisitDatetime !== null}
        onCancel={closeCreateModal}
        onSaved={closeCreateModal}
      />

      <InvitationFormModal
        invitation={editingInvitation}
        isOpen={editingInvitation !== null}
        onCancel={closeEditModal}
        onSaved={closeEditModal}
      />
    </main>
  )
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function toDatetimeLocalValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}T12:00`
}

export { CalendarPage }
