"use client"

import * as React from "react"

import { JoinerFormModal } from "@/components/joiners/joiner-form-modal"
import { JoinersHeader } from "@/components/joiners/joiners-header"
import { JoinersTable } from "@/components/joiners/joiners-table"
import { useJoiners } from "@/hooks/use-joiners"
import type { Joiner } from "@/lib/joiners"

function JoinersPage() {
  const joinersQuery = useJoiners()
  const joiners = joinersQuery.data?.joiners ?? []
  const [editingJoiner, setEditingJoiner] = React.useState<Joiner | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)

  function openCreateForm() {
    setEditingJoiner(null)
    setIsFormOpen(true)
  }

  function openEditForm(joiner: Joiner) {
    setEditingJoiner(joiner)
    setIsFormOpen(true)
  }

  function closeForm() {
    setEditingJoiner(null)
    setIsFormOpen(false)
  }

  return (
    <main className="flex flex-col gap-6">
      <JoinersHeader joinerCount={joiners.length} onCreateNew={openCreateForm} />

      <JoinersTable
        isLoading={joinersQuery.isLoading}
        joiners={joiners}
        onEdit={openEditForm}
      />

      {isFormOpen ? (
        <JoinerFormModal
          isOpen={isFormOpen}
          joiner={editingJoiner}
          onCancel={closeForm}
          onSaved={closeForm}
        />
      ) : null}
    </main>
  )
}

export { JoinersPage }
