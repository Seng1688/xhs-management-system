"use client"

import { Edit, Trash2 } from "lucide-react"
import * as React from "react"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import {
  SmartTable,
  type SmartTableTemplate,
} from "@/components/table/smart-table"
import {
  useDeleteJoinerMutation,
  useUpdateJoinerMutation,
} from "@/hooks/use-joiners"
import type { Joiner } from "@/lib/joiners"

type JoinersTableProps = {
  isLoading: boolean
  joiners: Joiner[]
  onEdit: (joiner: Joiner) => void
}

function JoinersTable({ isLoading, joiners, onEdit }: JoinersTableProps) {
  const deleteMutation = useDeleteJoinerMutation()
  const updateMutation = useUpdateJoinerMutation()
  const [deletingJoiner, setDeletingJoiner] = React.useState<Joiner | null>(null)

  function confirmDeleteJoiner() {
    if (!deletingJoiner) {
      return
    }

    deleteMutation.mutate(deletingJoiner.id, {
      onSuccess: () => setDeletingJoiner(null),
    })
  }

  const tableTemplate = React.useMemo<SmartTableTemplate<Joiner>>(
    () => ({
      columns: [
        {
          accessorKey: "name",
          header: "Name",
          id: "name",
          sortable: true,
        },
        {
          accessorKey: "email",
          header: "Email",
          id: "email",
          sortable: true,
        },
        {
          header: "Reminder email",
          id: "sendEmail",
          render: (joiner) => (
            <button
              className={
                joiner.sendEmail
                  ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              }
              disabled={updateMutation.isPending}
              type="button"
              onClick={() =>
                updateMutation.mutate({
                  id: joiner.id,
                  input: {
                    sendEmail: !joiner.sendEmail,
                  },
                })
              }
            >
              {joiner.sendEmail ? "On" : "Off"}
            </button>
          ),
          sortable: true,
          sortValue: (joiner) => String(joiner.sendEmail),
        },
        {
          header: "Updated",
          id: "updatedAt",
          render: (joiner) => formatDate(joiner.updatedAt),
          sortable: true,
          sortValue: (joiner) => new Date(joiner.updatedAt).getTime(),
        },
      ],
      defaultSort: {
        columnId: "name",
        direction: "asc",
      },
      emptyMessage: "No joiners found.",
      getRowId: (joiner) => joiner.id,
      isLoading,
      loadingMessage: "Loading joiners...",
      minWidth: "720px",
      rowActions: [
        {
          ariaLabel: (joiner) => `Edit ${joiner.name}`,
          icon: <Edit aria-hidden="true" />,
          onClick: onEdit,
          variant: "outline",
        },
        {
          ariaLabel: (joiner) => `Delete ${joiner.name}`,
          disabled: () => deleteMutation.isPending,
          icon: <Trash2 aria-hidden="true" />,
          onClick: setDeletingJoiner,
          variant: "destructive",
        },
      ],
    }),
    [deleteMutation.isPending, isLoading, onEdit, updateMutation]
  )

  return (
    <>
      <SmartTable rows={joiners} template={tableTemplate} />
      <ConfirmDialog
        description={
          deletingJoiner
            ? `Delete ${deletingJoiner.name}? This will remove them from existing invitations, but will not delete the invitations.`
            : ""
        }
        isConfirming={deleteMutation.isPending}
        isOpen={deletingJoiner !== null}
        title="Delete joiner"
        onCancel={() => setDeletingJoiner(null)}
        onConfirm={confirmDeleteJoiner}
      />
    </>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export { JoinersTable }
