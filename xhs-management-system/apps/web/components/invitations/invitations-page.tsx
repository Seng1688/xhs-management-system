"use client"

import * as React from "react"

import { InvitationFilters } from "@/components/invitations/invitation-filters"
import { InvitationFormModal } from "@/components/invitations/invitation-form-modal"
import { InvitationsHeader } from "@/components/invitations/invitations-header"
import { InvitationsTable } from "@/components/invitations/invitations-table"
import { useInvitations } from "@/hooks/use-invitations"
import type {
  Invitation,
  InvitationFilters as InvitationFilterValues,
} from "@/lib/invitations"

const defaultFilters: InvitationFilterValues = {
  search: "",
  status: "all",
  visitType: "all",
}

type FormMode = "closed" | "create" | "edit"

function InvitationsPage() {
  const [filters, setFilters] =
    React.useState<InvitationFilterValues>(defaultFilters)
  const [editingInvitation, setEditingInvitation] =
    React.useState<Invitation | null>(null)
  const [formMode, setFormMode] = React.useState<FormMode>("closed")

  const invitationsQuery = useInvitations(filters)
  const invitations = invitationsQuery.data?.invitations ?? []

  function openCreateForm() {
    setEditingInvitation(null)
    setFormMode("create")
  }

  function openEditForm(invitation: Invitation) {
    setEditingInvitation(invitation)
    setFormMode("edit")
  }

  function closeForm() {
    setEditingInvitation(null)
    setFormMode("closed")
  }

  return (
    <main className="flex flex-col gap-6">
      <InvitationsHeader
        invitationCount={invitations.length}
        onCreateNew={openCreateForm}
      />

      <section className="min-w-0 space-y-4">
        <InvitationFilters filters={filters} onFiltersChange={setFilters} />
        <InvitationsTable
          invitations={invitations}
          isLoading={invitationsQuery.isLoading}
          onEdit={openEditForm}
        />
      </section>

      <InvitationFormModal
        invitation={formMode === "edit" ? editingInvitation : null}
        isOpen={formMode !== "closed"}
        onCancel={closeForm}
        onSaved={closeForm}
      />
    </main>
  )
}

export { InvitationsPage }
