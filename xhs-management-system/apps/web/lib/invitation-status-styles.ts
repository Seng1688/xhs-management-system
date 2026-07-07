import type { InvitationStatus } from "@/lib/invitations"
import { cn } from "@workspace/ui/lib/utils"

const invitationStatusClassNames: Record<InvitationStatus, string> = {
  "Pending Review":
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
  Scheduled:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200",
  Completed:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  Declined:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200",
}

function getInvitationStatusClassName(
  status: InvitationStatus,
  className?: string
) {
  return cn(invitationStatusClassNames[status], className)
}

export { getInvitationStatusClassName, invitationStatusClassNames }
