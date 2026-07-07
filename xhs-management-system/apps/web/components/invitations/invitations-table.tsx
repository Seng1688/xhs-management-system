"use client"

import { AlertTriangle, CalendarClock, Edit, Trash2 } from "lucide-react"
import * as React from "react"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { InvitationStatusSelect } from "@/components/invitations/invitation-status-select"
import {
  SmartTable,
  type SmartTableTemplate,
} from "@/components/table/smart-table"
import { useDeleteInvitationMutation } from "@/hooks/use-invitations"
import type { Invitation } from "@/lib/invitations"
import { getMissingFieldHints } from "@/lib/workflow"

type InvitationsTableProps = {
  invitations: Invitation[]
  isLoading: boolean
  onEdit: (invitation: Invitation) => void
}

function InvitationsTable({
  invitations,
  isLoading,
  onEdit,
}: InvitationsTableProps) {
  const deleteMutation = useDeleteInvitationMutation()
  const [deletingInvitation, setDeletingInvitation] =
    React.useState<Invitation | null>(null)

  function confirmDeleteInvitation() {
    if (!deletingInvitation) {
      return
    }

    deleteMutation.mutate(deletingInvitation.id, {
      onSuccess: () => setDeletingInvitation(null),
    })
  }

  const tableTemplate = React.useMemo<SmartTableTemplate<Invitation>>(
    () => ({
      columns: [
        {
          header: "Visit",
          id: "visitDatetime",
          render: (invitation) => (
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" aria-hidden="true" />
              <span>{formatVisitDate(invitation.visitDatetime)}</span>
            </div>
          ),
          sortable: true,
          sortValue: (invitation) =>
            invitation.visitDatetime
              ? new Date(invitation.visitDatetime).getTime()
              : null,
        },
        {
          header: "Shop",
          id: "shopName",
          render: (invitation) => <ShopCell invitation={invitation} />,
          sortable: true,
          sortValue: (invitation) => invitation.shopName,
        },
        {
          accessorKey: "visitType",
          header: "Type",
          id: "visitType",
          sortable: true,
        },
        {
          header: "Joiners",
          id: "joiners",
          render: (invitation) =>
            invitation.joiners.length > 0 ? (
              <div className="flex max-w-48 flex-wrap gap-1">
                {invitation.joiners.map((joiner) => (
                  <span
                    key={joiner.id}
                    title={joiner.email}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium"
                  >
                    {joiner.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            ),
          sortable: true,
          sortValue: (invitation) =>
            invitation.joiners.map((joiner) => joiner.name).join(", "),
        },
        {
          header: "Status",
          id: "status",
          render: (invitation) => (
            <InvitationStatusSelect
              id={invitation.id}
              status={invitation.status}
            />
          ),
          sortable: true,
          sortValue: (invitation) => invitation.status,
        },
        {
          header: "Compensation",
          id: "compensation",
          render: (invitation) => (
            <span className="line-clamp-2 max-w-56">
              {invitation.compensation ?? "Not set"}
            </span>
          ),
          sortable: true,
          sortValue: (invitation) => invitation.compensation,
        },
      ],
      defaultSort: {
        columnId: "visitDatetime",
        direction: "desc",
      },
      emptyMessage: "No invitations found.",
      getRowId: (invitation) => invitation.id,
      isLoading,
      loadingMessage: "Loading invitations...",
      minWidth: "940px",
      rowActions: [
        {
          ariaLabel: (invitation) => `Edit ${invitation.shopName}`,
          icon: <Edit aria-hidden="true" />,
          onClick: onEdit,
          variant: "outline",
        },
        {
          ariaLabel: (invitation) => `Delete ${invitation.shopName}`,
          disabled: () => deleteMutation.isPending,
          icon: <Trash2 aria-hidden="true" />,
          onClick: setDeletingInvitation,
          variant: "destructive",
        },
      ],
    }),
    [deleteMutation, isLoading, onEdit]
  )

  return (
    <>
      <SmartTable rows={invitations} template={tableTemplate} />
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
    </>
  )
}

function ShopCell({ invitation }: { invitation: Invitation }) {
  const hints = getMissingFieldHints(invitation)
  const visibleHints = hints.slice(0, 2)
  const hiddenHintCount = hints.length - visibleHints.length

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="font-medium">{invitation.shopName}</p>
        {invitation.remarks ? (
          <p className="line-clamp-2 max-w-60 text-xs text-muted-foreground">
            {invitation.remarks}
          </p>
        ) : null}
      </div>

      {hints.length > 0 ? (
        <div className="flex max-w-72 flex-wrap gap-1.5">
          {visibleHints.map((hint) => (
            <span
              key={hint.id}
              className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
            >
              <AlertTriangle className="size-3" aria-hidden="true" />
              {hint.label}
            </span>
          ))}
          {hiddenHintCount > 0 ? (
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              +{hiddenHintCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function formatVisitDate(value: string | null) {
  if (!value) {
    return "Not scheduled"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export { InvitationsTable }
