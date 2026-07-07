"use client"

import {
  useUpdateInvitationMutation,
} from "@/hooks/use-invitations"
import { getInvitationStatusClassName } from "@/lib/invitation-status-styles"
import {
  invitationStatuses,
  type InvitationStatus,
} from "@/lib/invitations"

type InvitationStatusSelectProps = {
  id: string
  status: InvitationStatus
}

function InvitationStatusSelect({ id, status }: InvitationStatusSelectProps) {
  const updateMutation = useUpdateInvitationMutation()

  return (
    <select
      className={getInvitationStatusClassName(
        status,
        "h-8 w-full min-w-36 rounded-md border px-2 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      )}
      disabled={updateMutation.isPending}
      value={status}
      onChange={(event) =>
        updateMutation.mutate({
          id,
          input: {
            status: event.target.value as InvitationStatus,
          },
        })
      }
    >
      {invitationStatuses.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export { InvitationStatusSelect }
