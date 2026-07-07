"use client"

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SortDirection = "asc" | "desc"

type SmartTableColumn<Row> = {
  accessorKey?: keyof Row
  className?: string
  header: string
  id: string
  render?: (row: Row) => React.ReactNode
  sortable?: boolean
  sortValue?: (row: Row) => Date | number | string | null | undefined
}

type SmartTableRowAction<Row> = {
  ariaLabel: (row: Row) => string
  disabled?: (row: Row) => boolean
  icon: React.ReactNode
  onClick: (row: Row) => void
  variant?: "outline" | "destructive" | "ghost"
}

type SmartTableTemplate<Row> = {
  columns: SmartTableColumn<Row>[]
  defaultSort?: {
    columnId: string
    direction: SortDirection
  }
  emptyMessage?: string
  getRowId: (row: Row) => string
  isLoading?: boolean
  loadingMessage?: string
  minWidth?: string
  rowActions?: SmartTableRowAction<Row>[]
}

function SmartTable<Row>({
  rows,
  template,
}: {
  rows: Row[]
  template: SmartTableTemplate<Row>
}) {
  const [sort, setSort] = React.useState<{
    columnId: string
    direction: SortDirection
  } | null>(template.defaultSort ?? null)

  const sortedRows = React.useMemo(() => {
    if (!sort) {
      return rows
    }

    const column = template.columns.find((item) => item.id === sort.columnId)

    if (!column) {
      return rows
    }

    return [...rows].sort((first, second) => {
      const firstValue = getSortValue(first, column)
      const secondValue = getSortValue(second, column)
      const comparison = compareValues(firstValue, secondValue)

      return sort.direction === "asc" ? comparison : -comparison
    })
  }, [rows, sort, template.columns])

  if (template.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        {template.loadingMessage ?? "Loading..."}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center text-sm text-muted-foreground">
        {template.emptyMessage ?? "No data found."}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          style={{ minWidth: template.minWidth }}
        >
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {template.columns.map((column) => (
                <th
                  key={column.id}
                  className={cn("px-4 py-3 font-medium", column.className)}
                >
                  {column.sortable ? (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      type="button"
                      onClick={() => setNextSort(column.id, setSort)}
                    >
                      {column.header}
                      <SortIcon columnId={column.id} sort={sort} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {template.rowActions ? (
                <th className="px-4 py-3 font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={template.getRowId(row)}
                className="border-t border-border align-top"
              >
                {template.columns.map((column) => (
                  <td key={column.id} className="px-4 py-4">
                    {renderCell(row, column)}
                  </td>
                ))}
                {template.rowActions ? (
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {template.rowActions.map((action, index) => (
                        <Button
                          key={index}
                          aria-label={action.ariaLabel(row)}
                          disabled={action.disabled?.(row)}
                          size="icon-sm"
                          type="button"
                          variant={action.variant ?? "outline"}
                          onClick={() => action.onClick(row)}
                        >
                          {action.icon}
                        </Button>
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderCell<Row>(row: Row, column: SmartTableColumn<Row>) {
  if (column.render) {
    return column.render(row)
  }

  if (!column.accessorKey) {
    return null
  }

  const value = row[column.accessorKey]

  return value == null || value === "" ? (
    <span className="text-muted-foreground">Not set</span>
  ) : (
    String(value)
  )
}

function getSortValue<Row>(row: Row, column: SmartTableColumn<Row>) {
  if (column.sortValue) {
    const value = column.sortValue(row)

    return value instanceof Date ? value.getTime() : value
  }

  if (!column.accessorKey) {
    return undefined
  }

  const value = row[column.accessorKey]

  return value instanceof Date ? value.getTime() : String(value ?? "")
}

function compareValues(
  firstValue: Date | number | string | null | undefined,
  secondValue: Date | number | string | null | undefined
) {
  if (firstValue == null && secondValue == null) {
    return 0
  }

  if (firstValue == null) {
    return 1
  }

  if (secondValue == null) {
    return -1
  }

  if (typeof firstValue === "number" && typeof secondValue === "number") {
    return firstValue - secondValue
  }

  return String(firstValue).localeCompare(String(secondValue))
}

function setNextSort(
  columnId: string,
  setSort: React.Dispatch<
    React.SetStateAction<{ columnId: string; direction: SortDirection } | null>
  >
) {
  setSort((current) => {
    if (current?.columnId !== columnId) {
      return { columnId, direction: "asc" }
    }

    if (current.direction === "asc") {
      return { columnId, direction: "desc" }
    }

    return null
  })
}

function SortIcon({
  columnId,
  sort,
}: {
  columnId: string
  sort: { columnId: string; direction: SortDirection } | null
}) {
  if (sort?.columnId !== columnId) {
    return <ChevronsUpDown className="size-3.5" aria-hidden="true" />
  }

  if (sort.direction === "asc") {
    return <ArrowUp className="size-3.5" aria-hidden="true" />
  }

  return <ArrowDown className="size-3.5" aria-hidden="true" />
}

export { SmartTable, type SmartTableTemplate }
