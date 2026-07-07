"use client"

import {
  CheckCircle2,
  Circle,
  FileCheck2,
  LoaderCircle,
  MapPinned,
  Sparkles,
  XCircle,
} from "lucide-react"

type ProgressStepStatus = "error" | "idle" | "loading" | "success"

type ProgressStep = {
  description: string
  icon: typeof Sparkles
  id: string
  label: string
  status: ProgressStepStatus
}

type AiProgressTrackerProps = {
  error?: string
  isComplete: boolean
  isGenerating: boolean
  phase: "ai" | "geo" | "idle"
  shopEnrichmentStatus?: "error" | "skipped" | "success"
}

function AiProgressTracker({
  error,
  isComplete,
  isGenerating,
  phase,
  shopEnrichmentStatus,
}: AiProgressTrackerProps) {
  const steps = getSteps({
    error,
    isComplete,
    isGenerating,
    phase,
    shopEnrichmentStatus,
  })
  const completedStepCount = steps.filter(
    (step) => step.status === "success"
  ).length
  const progressPercent = getProgressPercent({
    completedStepCount,
    isComplete,
    isGenerating,
    stepCount: steps.length,
  })

  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3">
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={getProgressBarClassName(steps)}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-0">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="relative min-w-0 sm:px-2"
          >
            {index < steps.length - 1 ? (
              <div
                className={`absolute left-[1.375rem] top-5 h-[calc(100%+0.75rem)] w-px sm:left-[calc(50%+1.25rem)] sm:top-5 sm:h-px sm:w-[calc(100%-2.5rem)] ${getConnectorClassName(step.status)}`}
              />
            ) : null}

            <div className="relative z-10 flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${getStepCircleClassName(step.status)}`}
              >
                <StepStatusIcon status={step.status} />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:justify-center">
                  <step.icon aria-hidden="true" className="size-4" />
                  <p className="text-sm font-medium">{step.label}</p>
                </div>
                <p className={`text-xs ${getStepTextClassName(step.status)}`}>
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getSteps({
  error,
  isComplete,
  isGenerating,
  phase,
  shopEnrichmentStatus,
}: AiProgressTrackerProps): ProgressStep[] {
  const hasError = Boolean(error)

  return [
    {
      description: getAiDescription({ error, isComplete, isGenerating, phase }),
      icon: Sparkles,
      id: "ai-analysis",
      label: "AI Analysis",
      status: getAiStatus({ hasError, isComplete, isGenerating, phase }),
    },
    {
      description: getGeoDescription({
        isComplete,
        isGenerating,
        phase,
        shopEnrichmentStatus,
      }),
      icon: MapPinned,
      id: "geo-analysis",
      label: "Geographic Analysis",
      status: getGeoStatus({
        hasError,
        isComplete,
        isGenerating,
        phase,
        shopEnrichmentStatus,
      }),
    },
    {
      description: getDraftDescription({ error, isComplete, isGenerating }),
      icon: FileCheck2,
      id: "draft-ready",
      label: "Draft Ready",
      status: getDraftStatus({ hasError, isComplete, isGenerating }),
    },
  ]
}

function getAiStatus({
  hasError,
  isComplete,
  isGenerating,
  phase,
}: {
  hasError: boolean
  isComplete: boolean
  isGenerating: boolean
  phase: AiProgressTrackerProps["phase"]
}): ProgressStepStatus {
  if (hasError) {
    return "error"
  }

  if (isComplete || phase === "geo") {
    return "success"
  }

  return isGenerating ? "loading" : "idle"
}

function getGeoStatus({
  hasError,
  isComplete,
  isGenerating,
  phase,
  shopEnrichmentStatus,
}: {
  hasError: boolean
  isComplete: boolean
  isGenerating: boolean
  phase: AiProgressTrackerProps["phase"]
  shopEnrichmentStatus?: AiProgressTrackerProps["shopEnrichmentStatus"]
}): ProgressStepStatus {
  if (hasError) {
    return "idle"
  }

  if (isComplete) {
    return shopEnrichmentStatus === "error" ? "error" : "success"
  }

  if (isGenerating && phase === "geo") {
    return "loading"
  }

  return "idle"
}

function getDraftStatus({
  hasError,
  isComplete,
  isGenerating,
}: {
  hasError: boolean
  isComplete: boolean
  isGenerating: boolean
}): ProgressStepStatus {
  if (hasError) {
    return "error"
  }

  if (isComplete) {
    return "success"
  }

  return isGenerating ? "idle" : "idle"
}

function getAiDescription({
  error,
  isComplete,
  isGenerating,
  phase,
}: Pick<AiProgressTrackerProps, "error" | "isComplete" | "isGenerating" | "phase">) {
  if (error) {
    return "Invitation analysis failed."
  }

  if (isComplete || phase === "geo") {
    return "Invitation details extracted."
  }

  return isGenerating ? "Analysing invitation content..." : "Waiting to start."
}

function getGeoDescription({
  isComplete,
  isGenerating,
  phase,
  shopEnrichmentStatus,
}: Pick<
  AiProgressTrackerProps,
  "isComplete" | "isGenerating" | "phase" | "shopEnrichmentStatus"
>) {
  if (isComplete) {
    if (shopEnrichmentStatus === "error") {
      return "Shop location search failed."
    }

    if (shopEnrichmentStatus === "skipped") {
      return "Shop location search skipped."
    }

    return "Geographic analysing complete."
  }

  if (isGenerating && phase === "geo") {
    return "Searching matching shop address..."
  }

  return "Waiting for AI shop description."
}

function getDraftDescription({
  error,
  isComplete,
  isGenerating,
}: Pick<AiProgressTrackerProps, "error" | "isComplete" | "isGenerating">) {
  if (error) {
    return "Draft was not updated."
  }

  if (isComplete) {
    return "Invitation form is ready."
  }

  return isGenerating ? "Preparing invitation form..." : "Waiting for results."
}

function StepStatusIcon({ status }: { status: ProgressStepStatus }) {
  if (status === "success") {
    return <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
  }

  if (status === "error") {
    return <XCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
  }

  if (status === "loading") {
    return (
      <LoaderCircle
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 animate-spin"
      />
    )
  }

  return <Circle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
}

function getStepCircleClassName(status: ProgressStepStatus) {
  if (status === "success") {
    return "border-emerald-500 bg-emerald-50 text-emerald-700"
  }

  if (status === "error") {
    return "border-destructive bg-destructive/10 text-destructive"
  }

  if (status === "loading") {
    return "border-primary bg-primary/10 text-primary"
  }

  return "border-border bg-background text-muted-foreground"
}

function getStepTextClassName(status: ProgressStepStatus) {
  if (status === "success") {
    return "text-emerald-700"
  }

  if (status === "error") {
    return "text-destructive"
  }

  if (status === "loading") {
    return "text-primary"
  }

  return "text-muted-foreground"
}

function getConnectorClassName(status: ProgressStepStatus) {
  if (status === "success") {
    return "bg-emerald-500"
  }

  if (status === "error") {
    return "bg-destructive"
  }

  return "bg-border"
}

function getProgressBarClassName(steps: ProgressStep[]) {
  if (steps.some((step) => step.status === "error")) {
    return "h-full rounded-full bg-destructive transition-all duration-500"
  }

  if (steps.every((step) => step.status === "success")) {
    return "h-full rounded-full bg-emerald-500 transition-all duration-500"
  }

  return "h-full rounded-full bg-primary transition-all duration-500"
}

function getProgressPercent({
  completedStepCount,
  isComplete,
  isGenerating,
  stepCount,
}: {
  completedStepCount: number
  isComplete: boolean
  isGenerating: boolean
  stepCount: number
}) {
  if (isComplete) {
    return 100
  }

  return Math.max(
    0,
    ((completedStepCount + (isGenerating ? 0.45 : 0)) / stepCount) * 100
  )
}

export { AiProgressTracker }
