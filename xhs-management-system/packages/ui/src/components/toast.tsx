"use client"

import { CheckCircle2, Info, X, XCircle } from "lucide-react"
import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type ToastVariant = "default" | "destructive" | "success"

type ToastInput = {
  description?: string
  title: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & {
  id: string
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  function toast(input: ToastInput) {
    const id = crypto.randomUUID()

    setToasts((current) => [
      ...current,
      {
        ...input,
        id,
        variant: input.variant ?? "default",
      },
    ])

    window.setTimeout(() => dismiss(id), 3500)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({
  onDismiss,
  toast,
}: {
  onDismiss: (id: string) => void
  toast: ToastItem
}) {
  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "destructive"
        ? XCircle
        : Info

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-background p-3 text-sm shadow-lg",
        toast.variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100",
        toast.variant === "destructive" &&
          "border-destructive/30 bg-destructive/10 text-destructive"
      )}
      role="status"
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>
        ) : null}
      </div>
      <button
        aria-label="Dismiss notification"
        className="rounded-md p-1 opacity-70 transition hover:bg-foreground/10 hover:opacity-100"
        type="button"
        onClick={() => onDismiss(toast.id)}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.")
  }

  return context
}

export { ToastProvider, useToast, type ToastInput }
