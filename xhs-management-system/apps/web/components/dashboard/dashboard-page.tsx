"use client"

import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { useContentInvitations } from "@/hooks/use-content"
import { useVisitPrepBriefingMutation } from "@/hooks/use-ai-invitation-analysis"
import { useEscapeKey } from "@/hooks/use-escape-key"
import { useInvitations } from "@/hooks/use-invitations"
import type { Content } from "@/lib/content"
import type { Invitation } from "@/lib/invitations"
import {
  contentFollowUpDays,
  formatRelativeDays,
  getDaysSince,
  getMissingFieldHints,
  isVisitToday,
  isVisitTomorrow,
  needsContentFollowUp,
} from "@/lib/workflow"
import { Button } from "@workspace/ui/components/button"
import { useToast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const defaultFilters = {
  search: "",
  status: "all" as const,
  visitType: "all" as const,
}

type AnalyticsRange =
  | "7d"
  | "30d"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "all"

const analyticsRanges: { label: string; value: AnalyticsRange }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "This year", value: "thisYear" },
  { label: "All", value: "all" },
]

const statusChartConfig = {
  completed: {
    color: "var(--chart-1)",
    label: "Completed",
  },
  scheduled: {
    color: "var(--chart-2)",
    label: "Scheduled",
  },
  pending: {
    color: "var(--chart-3)",
    label: "Pending Review",
  },
} satisfies ChartConfig

const createdChartConfig = {
  count: {
    color: "var(--chart-4)",
    label: "Visits",
  },
} satisfies ChartConfig

const visitTypeChartConfig = {
  fnb: {
    color: "var(--chart-1)",
    label: "F&B",
  },
  service: {
    color: "var(--chart-2)",
    label: "Service",
  },
  product: {
    color: "var(--chart-3)",
    label: "Product",
  },
} satisfies ChartConfig

const joinerChartConfig = {
  count: {
    color: "var(--chart-5)",
    label: "Invitations",
  },
} satisfies ChartConfig

function DashboardPage() {
  const { toast } = useToast()
  const [analyticsRange, setAnalyticsRange] =
    React.useState<AnalyticsRange>("thisMonth")
  const [visitPrepModal, setVisitPrepModal] =
    React.useState<VisitPrepModalState | null>(null)
  const [generatingInvitationId, setGeneratingInvitationId] =
    React.useState<string | null>(null)
  const invitationsQuery = useInvitations(defaultFilters)
  const contentQuery = useContentInvitations()
  const visitPrepMutation = useVisitPrepBriefingMutation()
  const invitations = React.useMemo(
    () => invitationsQuery.data?.invitations ?? [],
    [invitationsQuery.data?.invitations]
  )
  const contentByInvitationId = React.useMemo(() => {
    const map = new Map<string, Content | null>()

    for (const item of contentQuery.data?.items ?? []) {
      map.set(item.invitation.id, item.content)
    }

    return map
  }, [contentQuery.data?.items])

  const todayVisits = invitations
    .filter((invitation) => isVisitToday(invitation))
    .sort(sortByVisitDatetime)
  const tomorrowVisits = invitations
    .filter((invitation) => isVisitTomorrow(invitation))
    .sort(sortByVisitDatetime)
  const contentFollowUps = invitations.filter((invitation) =>
    needsContentFollowUp(invitation, contentByInvitationId.get(invitation.id))
  )
  const missingInfo = invitations.filter(
    (invitation) => getMissingFieldHints(invitation).length > 0
  )
  const analytics = React.useMemo(
    () => getDashboardAnalytics(invitations, analyticsRange),
    [analyticsRange, invitations]
  )
  const isLoading = invitationsQuery.isLoading || contentQuery.isLoading

  async function openVisitPrepBriefing(invitation: Invitation) {
    setGeneratingInvitationId(invitation.id)
    setVisitPrepModal({
      invitation,
      status: "loading",
    })

    try {
      const briefing = await visitPrepMutation.mutateAsync(invitation.id)

      setVisitPrepModal({
        generatedAt: briefing.generatedAt,
        html: briefing.html,
        invitation,
        status: "success",
      })
    } catch (error) {
      const message = getErrorMessage(error, "Unable to generate visit prep.")

      setVisitPrepModal({
        error: message,
        invitation,
        status: "error",
      })
      toast({
        title: message,
        variant: "destructive",
      })
    } finally {
      setGeneratingInvitationId(null)
    }
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Creator CRM</p>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-normal">
              Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Your visit reminders, content follow-ups, and records that need
              clean-up.
            </p>
          </div>
        </div>

        <Button asChild type="button">
          <Link href="/invitations">Add invitation</Link>
        </Button>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarClock}
          label="Visits today"
          value={todayVisits.length}
        />
        <MetricCard
          icon={CalendarClock}
          label="Visits tomorrow"
          value={tomorrowVisits.length}
        />
        <MetricCard
          icon={FileText}
          label={`No content ${contentFollowUpDays}+ days`}
          value={contentFollowUps.length}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Missing info"
          value={missingInfo.length}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          actionHref="/calendar"
          actionLabel="Open calendar"
          emptyMessage="No visits scheduled for today."
          emoji="📍"
          isLoading={isLoading}
          items={todayVisits}
          renderItem={(invitation) => (
            <InvitationReminderItem
              action={
                <VisitPrepButton
                  disabled={visitPrepMutation.isPending}
                  isLoading={generatingInvitationId === invitation.id}
                  onClick={() => void openVisitPrepBriefing(invitation)}
                />
              }
              invitation={invitation}
              meta={formatVisitTime(invitation.visitDatetime)}
            />
          )}
          title="Reminder: visit today"
        />

        <DashboardPanel
          actionHref="/calendar"
          actionLabel="Open calendar"
          emptyMessage="No visits scheduled for tomorrow."
          emoji="⏰"
          isLoading={isLoading}
          items={tomorrowVisits}
          renderItem={(invitation) => (
            <InvitationReminderItem
              action={
                <VisitPrepButton
                  disabled={visitPrepMutation.isPending}
                  isLoading={generatingInvitationId === invitation.id}
                  onClick={() => void openVisitPrepBriefing(invitation)}
                />
              }
              invitation={invitation}
              meta={formatVisitTime(invitation.visitDatetime)}
            />
          )}
          title="Reminder: visit tomorrow"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          actionHref="/content"
          actionLabel="Open content"
          emptyMessage="No overdue content follow-ups."
          emoji="📝"
          isLoading={isLoading}
          items={contentFollowUps}
          renderItem={(invitation) => (
            <InvitationReminderItem
              invitation={invitation}
              meta={`Visited ${formatRelativeDays(
                getDaysSince(invitation.visitDatetime ?? invitation.updatedAt)
              )}`}
            />
          )}
          title={`Reminder: completed ${contentFollowUpDays}+ days, no content`}
        />
        <DashboardPanel
          actionHref="/invitations"
          actionLabel="Review invitations"
          emptyMessage="All invitation records have the key fields filled."
          emoji="⚠️"
          isLoading={isLoading}
          items={missingInfo.slice(0, 8)}
          renderItem={(invitation) => (
            <MissingInfoItem invitation={invitation} />
          )}
          title="Missing field hints"
        />
      </section>

      <AnalyticsSection
        analytics={analytics}
        isLoading={isLoading}
        range={analyticsRange}
        onRangeChange={setAnalyticsRange}
      />

      {visitPrepModal ? (
        <VisitPrepBriefingModal
          state={visitPrepModal}
          onClose={() => setVisitPrepModal(null)}
        />
      ) : null}
    </main>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden={true} />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-normal">
        {value}
      </p>
    </div>
  )
}

function AnalyticsSection({
  analytics,
  isLoading,
  onRangeChange,
  range,
}: {
  analytics: DashboardAnalytics
  isLoading: boolean
  onRangeChange: (range: AnalyticsRange) => void
  range: AnalyticsRange
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden={true}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-lg"
          >
            📊
          </span>
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold tracking-normal">
              Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Invitation activity during the selected period.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted p-1">
          {analyticsRanges.map((item) => (
            <button
              key={item.value}
              className={cn(
                "h-8 rounded-sm px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                range === item.value &&
                  "bg-background text-foreground shadow-sm"
              )}
              type="button"
              onClick={() => onRangeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AnalyticsMetric
          emoji="📅"
          label="Total visits"
          value={analytics.visitCount}
        />
        <AnalyticsMetric
          emoji="✅"
          label="Completed visits"
          value={analytics.completedCount}
        />
        <AnalyticsMetric
          emoji="🟦"
          label="Open visits"
          value={analytics.openVisitCount}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          description="Current status mix for invitations with visits in range."
          emoji="🥧"
          isLoading={isLoading}
          title="Status breakdown"
        >
          {analytics.statusData.length > 0 ? (
            <ChartContainer
              className="mx-auto aspect-square max-h-72"
              config={statusChartConfig}
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={false}
                />
                <Pie
                  data={analytics.statusData}
                  dataKey="value"
                  innerRadius={48}
                  nameKey="status"
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {analytics.statusData.map((item) => (
                    <Cell key={item.status} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyChartMessage message="No invitation data in this period." />
          )}
        </ChartCard>

        <ChartCard
          description="Visit types sorted by count in the selected period."
          emoji="🏷️"
          isLoading={isLoading}
          title="Visit type breakdown"
        >
          {analytics.visitTypeData.length > 0 ? (
            <ChartContainer
              className="mx-auto aspect-square max-h-72"
              config={visitTypeChartConfig}
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={false}
                />
                <Pie
                  data={analytics.visitTypeData}
                  dataKey="value"
                  innerRadius={48}
                  nameKey="visitType"
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {analytics.visitTypeData.map((item) => (
                    <Cell key={item.visitType} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyChartMessage message="No visit type data in this period." />
          )}
        </ChartCard>

        <ChartCard
          className="xl:col-span-1"
          description="Scheduled visit dates over the selected period."
          emoji="📈"
          isLoading={isLoading}
          title="Visits over time"
        >
          {analytics.visitSeries.length > 0 ? (
            <ChartContainer className="h-72" config={createdChartConfig}>
              <BarChart
                accessibilityLayer
                data={analytics.visitSeries}
                margin={{ left: -20, right: 12, top: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChartMessage message="No visits in this period." />
          )}
        </ChartCard>

        <ChartCard
          className="xl:col-span-1"
          description="Invitation count by joiner in the selected period."
          emoji="👥"
          isLoading={isLoading}
          title="Joiner involvement"
        >
          {analytics.joinerData.length > 0 ? (
            <ChartContainer
              className="h-80 min-w-0 overflow-hidden"
              config={joinerChartConfig}
            >
              <BarChart
                accessibilityLayer
                data={analytics.joinerData}
                layout="vertical"
                margin={{ bottom: 16, left: 0, right: 35, top: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  allowDecimals={false}
                  axisLine={true}
                  dataKey="count"
                  domain={[0, getJoinerXAxisDomainMax(analytics.joinerData)]}
                  tickLine={true}
                  tickMargin={8}
                  ticks={getJoinerXAxisTicks(analytics.joinerData)}
                  type="number"
                />
                <YAxis
                  axisLine={true}
                  dataKey="name"
                  tickFormatter={formatJoinerAxisLabel}
                  tickLine={true}
                  tickMargin={8}
                  type="category"
                  width={72}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={true}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    className="fill-primary-foreground text-xs"
                    dataKey="count"
                    position="insideRight"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChartMessage message="No joiner involvement in this period." />
          )}
        </ChartCard>
      </div>
    </section>
  )
}

function AnalyticsMetric({
  emoji,
  label,
  value,
}: {
  emoji: string
  label: string
  value: number
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          aria-hidden={true}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-sm"
        >
          {emoji}
        </span>
      </div>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-normal">
        {value}
      </p>
    </div>
  )
}

function ChartCard({
  children,
  className,
  description,
  emoji,
  isLoading,
  title,
}: {
  children: React.ReactNode
  className?: string
  description: string
  emoji: string
  isLoading: boolean
  title: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden={true}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-base"
        >
          {emoji}
        </span>
        <div className="space-y-1">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <EmptyChartMessage message="Loading chart data..." />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function DashboardPanel({
  actionHref,
  actionLabel,
  emptyMessage,
  emoji,
  isLoading,
  items,
  renderItem,
  title,
}: {
  actionHref: string
  actionLabel: string
  emptyMessage: string
  emoji: string
  isLoading: boolean
  items: Invitation[]
  renderItem: (invitation: Invitation) => React.ReactNode
  title: string
}) {
  return (
    <section className="rounded-lg border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden={true}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-base"
          >
            {emoji}
          </span>
          <h2 className="line-clamp-2 min-w-0 font-heading text-base font-semibold">
            {title}
          </h2>
        </div>
        <Button asChild className="shrink-0" size="sm" type="button">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : items.length > 0 ? (
          items.map((invitation) => (
            <div key={invitation.id} className="p-4">
              {renderItem(invitation)}
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

function InvitationReminderItem({
  action,
  invitation,
  meta,
}: {
  action?: React.ReactNode
  invitation: Invitation
  meta: string
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{invitation.shopName}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <StatusPill status={invitation.status} />
      </div>
    </div>
  )
}

function VisitPrepButton({
  disabled,
  isLoading,
  onClick,
}: {
  disabled: boolean
  isLoading: boolean
  onClick: () => void
}) {
  return (
    <Button
      className="border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-100 dark:hover:bg-teal-500/25"
      disabled={disabled}
      size="sm"
      type="button"
      variant="outline"
      onClick={onClick}
    >
      <Sparkles aria-hidden="true" />
      {isLoading ? "Generating..." : "AI prep"}
    </Button>
  )
}

type VisitPrepModalState =
  | {
      invitation: Invitation
      status: "loading"
    }
  | {
      error: string
      invitation: Invitation
      status: "error"
    }
  | {
      generatedAt: string
      html: string
      invitation: Invitation
      status: "success"
    }

function VisitPrepBriefingModal({
  onClose,
  state,
}: {
  onClose: () => void
  state: VisitPrepModalState
}) {
  useEscapeKey(onClose, state.status === "success" || state.status === "error")

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold">
              AI visit prep
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {state.invitation.shopName}
            </p>
          </div>
          <Button
            aria-label="Close AI visit prep"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {state.status === "loading" ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Generating visit prep...
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {state.error}
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Generated {formatUpdatedAt(state.generatedAt)}
              </p>
              <iframe
                className="h-[60vh] w-full rounded-lg border border-border bg-background"
                sandbox=""
                srcDoc={buildVisitPrepIframeDocument(state.html)}
                title={`AI visit prep for ${state.invitation.shopName}`}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MissingInfoItem({ invitation }: { invitation: Invitation }) {
  const hints = getMissingFieldHints(invitation)

  return (
    <div className="space-y-2">
      <InvitationReminderItem
        invitation={invitation}
        meta={formatUpdatedAt(invitation.updatedAt)}
      />
      <div className="flex flex-wrap gap-1.5">
        {hints.map((hint) => (
          <span
            key={hint.id}
            className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
          >
            {hint.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Invitation["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border px-2 py-1 text-xs font-medium",
        status === "Completed" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
        status === "Scheduled" &&
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200",
        status === "Pending Review" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
      )}
    >
      {status}
    </span>
  )
}

function formatVisitTime(value: string | null) {
  if (!value) {
    return "No visit time"
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatUpdatedAt(value: string) {
  return `Updated ${formatRelativeDays(getDaysSince(value))}`
}

function sortByVisitDatetime(first: Invitation, second: Invitation) {
  return (
    new Date(first.visitDatetime ?? 0).getTime() -
    new Date(second.visitDatetime ?? 0).getTime()
  )
}

type DashboardAnalytics = {
  completedCount: number
  openVisitCount: number
  statusData: {
    fill: string
    key: keyof typeof statusChartConfig
    status: Invitation["status"]
    value: number
  }[]
  joinerData: {
    count: number
    email: string
    id: string
    name: string
  }[]
  visitCount: number
  visitSeries: { count: number; label: string }[]
  visitTypeData: {
    fill: string
    key: keyof typeof visitTypeChartConfig
    value: number
    visitType: Invitation["visitType"]
  }[]
}

function getDashboardAnalytics(
  invitations: Invitation[],
  range: AnalyticsRange
): DashboardAnalytics {
  const window = getAnalyticsWindow(range)
  const visitsInRange = invitations.filter((invitation) =>
    isVisitInWindow(invitation, window)
  )
  const completedInRange = visitsInRange.filter(
    (invitation) => invitation.status === "Completed"
  )

  return {
    completedCount: completedInRange.length,
    joinerData: getJoinerData(visitsInRange),
    openVisitCount: visitsInRange.length - completedInRange.length,
    statusData: getStatusData(visitsInRange),
    visitCount: visitsInRange.length,
    visitSeries: getVisitSeries(visitsInRange, window, range),
    visitTypeData: getVisitTypeData(visitsInRange),
  }
}

function getJoinerData(invitations: Invitation[]) {
  const joinersById = new Map<
    string,
    {
      count: number
      email: string
      id: string
      name: string
    }
  >()

  for (const invitation of invitations) {
    for (const joiner of invitation.joiners) {
      const current = joinersById.get(joiner.id)

      joinersById.set(joiner.id, {
        count: (current?.count ?? 0) + 1,
        email: joiner.email,
        id: joiner.id,
        name: joiner.name,
      })
    }
  }

  return Array.from(joinersById.values()).sort(
    (first, second) =>
      second.count - first.count || first.name.localeCompare(second.name)
  )
}

function formatJoinerAxisLabel(value: string) {
  return value.length > 8 ? `${value.slice(0, 8)}...` : value
}

function getJoinerXAxisDomainMax(data: DashboardAnalytics["joinerData"]) {
  const maxCount = Math.max(...data.map((item) => item.count), 0)

  return Math.max(maxCount + 1, 1)
}

function getJoinerXAxisTicks(data: DashboardAnalytics["joinerData"]) {
  const maxCount = Math.max(...data.map((item) => item.count), 0)
  const step = maxCount > 8 ? 2 : 1
  const ticks: number[] = []

  for (let tick = 0; tick <= maxCount; tick += step) {
    ticks.push(tick)
  }

  return ticks
}

function getStatusData(invitations: Invitation[]) {
  const statuses: Invitation["status"][] = [
    "Completed",
    "Scheduled",
    "Pending Review",
  ]
  const keys: Record<Invitation["status"], keyof typeof statusChartConfig> = {
    Completed: "completed",
    Declined: "pending",
    "Pending Review": "pending",
    Scheduled: "scheduled",
  }

  return statuses
    .map((status) => ({
      fill: `var(--color-${keys[status]})`,
      key: keys[status],
      status,
      value: invitations.filter((invitation) => invitation.status === status)
        .length,
    }))
    .filter((item) => item.value > 0)
}

function getVisitTypeData(invitations: Invitation[]) {
  const visitTypes: Invitation["visitType"][] = ["F&B", "Service", "Product"]
  const keys: Record<
    Invitation["visitType"],
    keyof typeof visitTypeChartConfig
  > = {
    "F&B": "fnb",
    Product: "product",
    Service: "service",
  }

  return visitTypes
    .map((visitType) => ({
      fill: `var(--color-${keys[visitType]})`,
      key: keys[visitType],
      value: invitations.filter(
        (invitation) => invitation.visitType === visitType
      ).length,
      visitType,
    }))
    .filter((item) => item.value > 0)
    .sort((first, second) => second.value - first.value)
}

function getVisitSeries(
  invitations: Invitation[],
  window: AnalyticsWindow,
  range: AnalyticsRange
) {
  if (range === "all") {
    return groupVisitsByMonth(invitations)
  }

  const days = getDaysBetween(window.start, window.end)

  if (days > 45) {
    return groupVisitsByMonth(invitations)
  }

  const counts = new Map<string, number>()

  for (const invitation of invitations) {
    if (!invitation.visitDatetime) {
      continue
    }

    const key = toDateKey(new Date(invitation.visitDatetime))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from({ length: days + 1 }, (_, index) => {
    const date = addDays(window.start, index)
    const key = toDateKey(date)

    return {
      count: counts.get(key) ?? 0,
      label: formatShortDay(date),
    }
  })
}

function groupVisitsByMonth(invitations: Invitation[]) {
  const counts = new Map<string, { count: number; date: Date }>()

  for (const invitation of invitations) {
    if (!invitation.visitDatetime) {
      continue
    }

    const date = new Date(invitation.visitDatetime)
    const month = new Date(date.getFullYear(), date.getMonth(), 1)
    const key = `${month.getFullYear()}-${month.getMonth()}`
    const current = counts.get(key)

    counts.set(key, {
      count: (current?.count ?? 0) + 1,
      date: month,
    })
  }

  return Array.from(counts.values())
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .map((item) => ({
      count: item.count,
      label: formatShortMonth(item.date),
    }))
}

type AnalyticsWindow = {
  end: Date
  start: Date
}

function getAnalyticsWindow(range: AnalyticsRange): AnalyticsWindow {
  const now = new Date()

  if (range === "all") {
    return {
      end: new Date(8640000000000000),
      start: new Date(0),
    }
  }

  if (range === "7d") {
    return {
      end: now,
      start: addDays(startOfDay(now), -6),
    }
  }

  if (range === "30d") {
    return {
      end: now,
      start: addDays(startOfDay(now), -29),
    }
  }

  if (range === "thisMonth") {
    return {
      end: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      start: new Date(now.getFullYear(), now.getMonth(), 1),
    }
  }

  if (range === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    return { end, start }
  }

  return {
    end: endOfDay(new Date(now.getFullYear(), 11, 31)),
    start: new Date(now.getFullYear(), 0, 1),
  }
}

function isDateInWindow(value: string, window: AnalyticsWindow) {
  const time = new Date(value).getTime()

  return time >= window.start.getTime() && time <= window.end.getTime()
}

function isVisitInWindow(invitation: Invitation, window: AnalyticsWindow) {
  return Boolean(
    invitation.visitDatetime && isDateInWindow(invitation.visitDatetime, window)
  )
}

function getDaysBetween(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.max(
    0,
    Math.floor(
      (startOfDay(end).getTime() - startOfDay(start).getTime()) /
        millisecondsPerDay
    )
  )
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date)
}

function formatShortMonth(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "2-digit",
  }).format(date)
}

function buildVisitPrepIframeDocument(html: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        padding: 20px;
        background: transparent;
        color: #111827;
        font-size: 14px;
        line-height: 1.6;
      }
      section {
        margin: 0 0 18px;
        padding: 0 0 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      section:last-child {
        border-bottom: 0;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 18px;
        line-height: 1.3;
      }
      h3 {
        margin: 12px 0 6px;
        font-size: 15px;
      }
      p {
        margin: 0 0 8px;
      }
      ul, ol {
        margin: 0;
        padding-left: 20px;
      }
      li {
        margin: 4px 0;
      }
      strong {
        font-weight: 700;
      }
      small {
        color: #6b7280;
      }
      @media (prefers-color-scheme: dark) {
        body {
          color: #f9fafb;
        }
        section {
          border-color: #374151;
        }
        small {
          color: #9ca3af;
        }
      }
    </style>
  </head>
  <body>${html}</body>
</html>`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback
}

export { DashboardPage }
