"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@workspace/ui/lib/utils"

type ChartConfig = {
  [key: string]: {
    color?: string
    label?: React.ReactNode
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  children,
  className,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const id = React.useId()
  const chartId = `chart-${id.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ config, id }: { config: ChartConfig; id: string }) {
  const colorConfig = Object.entries(config).filter(([, item]) => item.color)

  if (colorConfig.length === 0) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig
  .map(([key, item]) => `  --color-${key}: ${item.color};`)
  .join("\n")}
}
`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipPayload = {
  color?: string
  dataKey?: number | string
  name?: number | string
  payload?: {
    fill?: string
    [key: string]: unknown
  }
  value?: React.ReactNode
}

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean
  formatter?: (
    value: React.ReactNode,
    name: number | string | undefined,
    item: ChartTooltipPayload,
    index: number,
    payload: ChartTooltipPayload["payload"]
  ) => React.ReactNode
  hideLabel?: boolean
  label?: React.ReactNode
  labelFormatter?: (
    label: React.ReactNode,
    payload: ChartTooltipPayload[]
  ) => React.ReactNode
  payload?: ChartTooltipPayload[]
}

function ChartTooltipContent({
  active,
  className,
  formatter,
  hideLabel = false,
  label,
  labelFormatter,
  payload,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const tooltipLabel =
    hideLabel || !label ? null : labelFormatter ? (
      <div className="font-medium">{labelFormatter(label, payload)}</div>
    ) : (
      <div className="font-medium">{label}</div>
    )

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl",
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? index)
          const itemConfig = config[key]
          const name = itemConfig?.label ?? item.name ?? key
          const color = item.color ?? item.payload?.fill

          return (
            <div
              key={key}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-muted-foreground">{name}</span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {formatter
                  ? formatter(item.value, item.name, item, index, item.payload)
                  : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
}
