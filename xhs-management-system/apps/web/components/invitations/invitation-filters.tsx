import { Search } from "lucide-react"

import {
  invitationStatuses,
  type InvitationFilters as InvitationFilterValues,
  visitTypes,
} from "@/lib/invitations"

type InvitationFiltersProps = {
  filters: InvitationFilterValues
  onFiltersChange: (filters: InvitationFilterValues) => void
}

function InvitationFilters({
  filters,
  onFiltersChange,
}: InvitationFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_180px_180px]">
      <label className="relative">
        <span className="sr-only">Search shop name</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search shop name"
          value={filters.search ?? ""}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
        />
      </label>

      <label>
        <span className="sr-only">Visit type</span>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={filters.visitType ?? "all"}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              visitType: event.target.value as InvitationFilterValues["visitType"],
            })
          }
        >
          <option value="all">All types</option>
          {visitTypes.map((visitType) => (
            <option key={visitType} value={visitType}>
              {visitType}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">Status</span>
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={filters.status ?? "all"}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as InvitationFilterValues["status"],
            })
          }
        >
          <option value="all">All status</option>
          {invitationStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export { InvitationFilters }
