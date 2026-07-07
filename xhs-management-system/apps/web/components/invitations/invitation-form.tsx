"use client"

import { Save, Search, Sparkles } from "lucide-react"
import * as React from "react"

import { AiGenerateModal } from "@/components/invitations/ai-generate-modal"
import { ShopCandidateModal } from "@/components/invitations/shop-candidate-modal"
import { ShopSearchModal } from "@/components/invitations/shop-search-modal"
import { useAiInvitationAnalysisMutation } from "@/hooks/use-ai-invitation-analysis"
import {
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
} from "@/hooks/use-invitations"
import { useJoiners } from "@/hooks/use-joiners"
import type { AiInvitationDraft, ShopCandidate, ShopEnrichment } from "@/lib/ai"
import { getInvitationStatusClassName } from "@/lib/invitation-status-styles"
import {
  contactRoles,
  invitationStatuses,
  type ContactRole,
  type Invitation,
  type InvitationInput,
  type InvitationStatus,
  type VisitType,
  visitTypes,
} from "@/lib/invitations"
import type { Joiner } from "@/lib/joiners"
import { Button } from "@workspace/ui/components/button"

type InvitationFormProps = {
  initialVisitDatetime?: string
  invitation: Invitation | null
  onSaved: () => void
}

type FormState = {
  aiAnalysisSessionId: string
  address: string
  compensation: string
  contactName: string
  contactNumber: string
  contactRole: ContactRole | ""
  joinerIds: string[]
  rawTextBackup: string
  remarks: string
  shopName: string
  status: InvitationStatus
  visitDatetime: string
  visitType: VisitType
}

type ConfidenceSource = "AI" | "n8n"

const emptyForm: FormState = {
  aiAnalysisSessionId: "",
  address: "",
  compensation: "",
  contactName: "",
  contactNumber: "",
  contactRole: "",
  joinerIds: [],
  rawTextBackup: "",
  remarks: "Pre-visit\n\nPost-visit\n",
  shopName: "",
  status: "Pending Review",
  visitDatetime: "",
  visitType: "F&B",
}

function InvitationForm({
  initialVisitDatetime,
  invitation,
  onSaved,
}: InvitationFormProps) {
  const aiMutation = useAiInvitationAnalysisMutation()
  const createMutation = useCreateInvitationMutation()
  const joinersQuery = useJoiners()
  const updateMutation = useUpdateInvitationMutation()
  const [form, setForm] = React.useState<FormState>(() =>
    invitation
      ? formFromInvitation(invitation)
      : {
          ...emptyForm,
          visitDatetime: initialVisitDatetime ?? emptyForm.visitDatetime,
        }
  )
  const aiCloseTimeoutRef = React.useRef<number | null>(null)
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false)
  const [isAiProgressComplete, setIsAiProgressComplete] = React.useState(false)
  const [shopEnrichment, setShopEnrichment] =
    React.useState<ShopEnrichment | null>(null)
  const [shopCandidates, setShopCandidates] = React.useState<ShopCandidate[]>([])
  const [isShopCandidateOpen, setIsShopCandidateOpen] = React.useState(false)
  const [isShopSearchOpen, setIsShopSearchOpen] = React.useState(false)
  const [aiConfidence, setAiConfidence] = React.useState<Record<string, number>>({})
  const [confidenceSources, setConfidenceSources] = React.useState<
    Record<string, ConfidenceSource>
  >({})

  const isSaving = createMutation.isPending || updateMutation.isPending
  const joiners = React.useMemo(
    () => joinersQuery.data?.joiners ?? [],
    [joinersQuery.data?.joiners]
  )
  const error = createMutation.error ?? updateMutation.error
  const canUseAi = !invitation

  React.useEffect(
    () => () => {
      clearAiCloseTimeout()
    },
    []
  )

  function clearAiCloseTimeout() {
    if (aiCloseTimeoutRef.current) {
      window.clearTimeout(aiCloseTimeoutRef.current)
      aiCloseTimeoutRef.current = null
    }
  }

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleJoiner(joinerId: string) {
    setForm((current) => ({
      ...current,
      joinerIds: current.joinerIds.includes(joinerId)
        ? current.joinerIds.filter((id) => id !== joinerId)
        : [...current.joinerIds, joinerId],
    }))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input = formToInput(form)

    if (invitation) {
      updateMutation.mutate(
        {
          id: invitation.id,
          input,
        },
        {
          onSuccess: onSaved,
        }
      )
      return
    }

    createMutation.mutate(input, {
      onSuccess: () => {
        setForm(emptyForm)
        onSaved()
      },
    })
  }

  function generateWithAi({
    additionalPrompt,
    rawText,
  }: {
    additionalPrompt?: string
    rawText: string
  }) {
    clearAiCloseTimeout()
    setIsAiProgressComplete(false)
    setShopEnrichment(null)

    aiMutation.mutate(
      {
        additionalPrompt,
        currentDraft: formToInput(form),
        rawText,
        sessionId: form.aiAnalysisSessionId || undefined,
      },
      {
        onSuccess: (result) => {
          setForm((current) => ({
            ...current,
            ...draftToFormPatch(result.draft, joiners),
            aiAnalysisSessionId: result.sessionId,
            rawTextBackup: rawText,
          }))
          setAiConfidence(result.confidence)
          setConfidenceSources(getAiConfidenceSources(result.confidence))
          setIsAiProgressComplete(true)
          setShopEnrichment(result.shopEnrichment)
          setShopCandidates(result.shopCandidates)
          aiCloseTimeoutRef.current = window.setTimeout(() => {
            setIsAiModalOpen(false)
            setIsAiProgressComplete(false)
            setIsShopCandidateOpen(result.shopCandidates.length > 0)
            aiCloseTimeoutRef.current = null
          }, 900)
        },
      }
    )
  }

  return (
    <form
      className="rounded-lg bg-background"
      onSubmit={onSubmit}
    >
      {canUseAi ? (
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearAiCloseTimeout()
              setIsAiProgressComplete(false)
              setShopEnrichment(null)
              setIsAiModalOpen(true)
            }}
          >
            <Sparkles aria-hidden="true" />
            AI Generate
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2 text-sm font-medium">
          <FieldLabel
            confidence={aiConfidence.shopName}
            confidenceSource={confidenceSources.shopName}
            label="Shop name"
            required
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className={getInputClassName(aiConfidence.shopName)}
              required
              value={form.shopName}
              onChange={(event) => updateField("shopName", event.target.value)}
            />
            <Button
              disabled={form.shopName.trim().length < 2}
              type="button"
              variant="outline"
              onClick={() => setIsShopSearchOpen(true)}
            >
              <Search aria-hidden="true" />
              Search details
            </Button>
          </div>
        </div>

        <Field
          confidence={aiConfidence.address}
          confidenceSource={confidenceSources.address}
          label="Address"
        >
          <input
            className={getInputClassName(aiConfidence.address)}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field confidence={aiConfidence.visitType} label="Visit type" required>
            <select
              className={getInputClassName(aiConfidence.visitType)}
              required
              value={form.visitType}
              onChange={(event) =>
                updateField("visitType", event.target.value as VisitType)
              }
            >
              {visitTypes.map((visitType) => (
                <option key={visitType} value={visitType}>
                  {visitType}
                </option>
              ))}
            </select>
          </Field>

          <Field confidence={aiConfidence.status} label="Status" required>
            <select
              className={getInvitationStatusClassName(
                form.status,
                "h-10 w-full rounded-md border px-3 text-sm font-medium outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              )}
              required
              value={form.status}
              onChange={(event) =>
                updateField("status", event.target.value as InvitationStatus)
              }
            >
              {invitationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-2 text-sm font-medium">
          <FieldLabel confidence={aiConfidence.joinerNames} label="Joiners" />
          <div className="grid gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-2">
            {joinersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading joiners...</p>
            ) : joiners.length > 0 ? (
              joiners.map((joiner) => (
                <label
                  key={joiner.id}
                  className="flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
                >
                  <input
                    checked={form.joinerIds.includes(joiner.id)}
                    className="size-4 accent-primary"
                    type="checkbox"
                    onChange={() => toggleJoiner(joiner.id)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {joiner.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {joiner.email}
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Create joiners before assigning them to invitations.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field confidence={aiConfidence.contactName} label="Contact name">
            <input
              className={getInputClassName(aiConfidence.contactName)}
              value={form.contactName}
              onChange={(event) =>
                updateField("contactName", event.target.value)
              }
            />
          </Field>

          <Field confidence={aiConfidence.contactRole} label="Contact role">
            <select
              className={getInputClassName(aiConfidence.contactRole)}
              value={form.contactRole}
              onChange={(event) =>
                updateField("contactRole", event.target.value as ContactRole | "")
              }
            >
              <option value="">Not set</option>
              {contactRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field confidence={aiConfidence.contactNumber} label="Contact number">
          <input
            className={getInputClassName(aiConfidence.contactNumber)}
            value={form.contactNumber}
            onChange={(event) =>
              updateField("contactNumber", event.target.value)
            }
          />
        </Field>

        <Field confidence={aiConfidence.visitDatetime} label="Visit date/time">
          <input
            className={getInputClassName(aiConfidence.visitDatetime)}
            type="datetime-local"
            value={form.visitDatetime}
            onChange={(event) =>
              updateField("visitDatetime", event.target.value)
            }
          />
        </Field>

        <Field confidence={aiConfidence.compensation} label="Compensation">
          <input
            className={getInputClassName(aiConfidence.compensation)}
            placeholder="Free meal, product exchange, paid rate..."
            value={form.compensation}
            onChange={(event) =>
              updateField("compensation", event.target.value)
            }
          />
        </Field>

        <Field confidence={aiConfidence.remarks} label="Remarks">
          <textarea
            className={getTextAreaClassName(aiConfidence.remarks)}
            rows={8}
            value={form.remarks}
            onChange={(event) => updateField("remarks", event.target.value)}
          />
        </Field>

      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <div className="mt-5">
        <Button className="w-full" disabled={isSaving} type="submit">
          <Save aria-hidden="true" />
          {isSaving ? "Saving..." : invitation ? "Save changes" : "Create"}
        </Button>
      </div>

      {isAiModalOpen ? (
        <AiGenerateModal
          error={aiMutation.error?.message}
          isComplete={isAiProgressComplete}
          isGenerating={aiMutation.isPending}
          rawText={form.rawTextBackup}
          shopEnrichment={shopEnrichment}
          onClose={() => {
            clearAiCloseTimeout()
            setIsAiModalOpen(false)
            setIsAiProgressComplete(false)
          }}
          onGenerate={generateWithAi}
        />
      ) : null}

      {isShopSearchOpen ? (
        <ShopSearchModal
          initialNear={form.address}
          initialQuery={form.shopName}
          onClose={() => setIsShopSearchOpen(false)}
          onSelect={(result) => {
            setForm((current) => ({
              ...current,
              address: result.address,
              shopName: result.name,
            }))
            setIsShopSearchOpen(false)
          }}
        />
      ) : null}

      {isShopCandidateOpen && shopCandidates.length > 0 ? (
        <ShopCandidateModal
          candidates={shopCandidates}
          onClose={() => setIsShopCandidateOpen(false)}
          onSelect={(candidate) => {
            setForm((current) => ({
              ...current,
              address: candidate.address,
              shopName: candidate.name,
            }))
            setAiConfidence((current) => ({
              ...current,
              address: getShopCandidateConfidence(candidate),
              shopName: getShopCandidateConfidence(candidate),
            }))
            setConfidenceSources((current) => ({
              ...current,
              address: "n8n",
              shopName: "n8n",
            }))
            setIsShopCandidateOpen(false)
          }}
        />
      ) : null}
    </form>
  )
}

function Field({
  children,
  confidence,
  confidenceSource = "AI",
  label,
  required,
}: {
  children: React.ReactNode
  confidence?: number
  confidenceSource?: ConfidenceSource
  label: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <FieldLabel
        confidence={confidence}
        confidenceSource={confidenceSource}
        label={label}
        required={required}
      />
      {children}
    </label>
  )
}

function FieldLabel({
  confidence,
  confidenceSource = "AI",
  label,
  required,
}: {
  confidence?: number
  confidenceSource?: ConfidenceSource
  label: string
  required?: boolean
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {confidence !== undefined ? (
        <span className={getConfidenceClassName(confidence)}>
          {confidenceSource} {getConfidenceLabel(confidence)}
        </span>
      ) : null}
    </span>
  )
}

function formToInput(form: FormState): InvitationInput {
  return {
    aiAnalysisSessionId: form.aiAnalysisSessionId || undefined,
    address: nullableText(form.address),
    compensation: nullableText(form.compensation),
    contactName: nullableText(form.contactName),
    contactNumber: nullableText(form.contactNumber),
    contactRole: form.contactRole || null,
    joinerIds: form.joinerIds,
    rawTextBackup: nullableText(form.rawTextBackup),
    remarks: nullableText(form.remarks),
    shopName: form.shopName,
    status: form.status,
    visitDatetime: form.visitDatetime || null,
    visitType: form.visitType,
  }
}

function formFromInvitation(invitation: Invitation): FormState {
  return {
    aiAnalysisSessionId: "",
    address: invitation.address ?? "",
    compensation: invitation.compensation ?? "",
    contactName: invitation.contactName ?? "",
    contactNumber: invitation.contactNumber ?? "",
    contactRole: invitation.contactRole ?? "",
    joinerIds: invitation.joiners.map((joiner) => joiner.id),
    rawTextBackup: invitation.rawTextBackup ?? "",
    remarks: invitation.remarks ?? "",
    shopName: invitation.shopName,
    status: invitation.status,
    visitDatetime: toDatetimeLocalValue(invitation.visitDatetime),
    visitType: invitation.visitType,
  }
}

function draftToFormPatch(
  draft: AiInvitationDraft,
  joiners: Joiner[]
): Partial<FormState> {
  return {
    address: stringValue(draft.address),
    compensation: stringValue(draft.compensation),
    contactName: stringValue(draft.contactName),
    contactNumber: stringValue(draft.contactNumber),
    contactRole: draft.contactRole ?? "",
    joinerIds: getUniqueJoinerIdsForNames(draft.joinerNames ?? [], joiners),
    rawTextBackup: stringValue(draft.rawTextBackup),
    remarks: stringValue(draft.remarks),
    shopName: stringValue(draft.shopName),
    status: draft.status ?? "Pending Review",
    visitDatetime: toDatetimeLocalValue(stringValue(draft.visitDatetime) || null),
    visitType: draft.visitType ?? "F&B",
  }
}

function getUniqueJoinerIdsForNames(names: string[], joiners: Joiner[]) {
  const ids: string[] = []

  for (const name of names) {
    const matches = joiners.filter((joiner) => joiner.name === name)
    const match = matches[0]

    if (matches.length === 1 && match) {
      ids.push(match.id)
    }
  }

  return Array.from(new Set(ids))
}

function getAiConfidenceSources(confidence: Record<string, number>) {
  return Object.fromEntries(
    Object.keys(confidence).map((field) => [field, "AI"])
  ) as Record<string, ConfidenceSource>
}

function getShopCandidateConfidence(candidate: ShopCandidate) {
  if (candidate.confidence === null) {
    return 1
  }

  return Math.max(0, Math.min(candidate.confidence, 1))
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 0.8) {
    return "High"
  }

  if (confidence >= 0.5) {
    return "Medium"
  }

  return "Low"
}

function getConfidenceClassName(confidence: number) {
  if (confidence >= 0.8) {
    return "rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800"
  }

  if (confidence >= 0.5) {
    return "rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800"
  }

  return "rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-800"
}

function getInputClassName(confidence?: number) {
  return confidence === undefined
    ? inputClassName
    : `${inputClassName} ${getConfidenceBorderClassName(confidence)}`
}

function getTextAreaClassName(confidence?: number) {
  return confidence === undefined
    ? textAreaClassName
    : `${textAreaClassName} ${getConfidenceBorderClassName(confidence)}`
}

function getConfidenceBorderClassName(confidence: number) {
  if (confidence >= 0.8) {
    return "border-emerald-300"
  }

  if (confidence >= 0.5) {
    return "border-amber-300"
  }

  return "border-rose-300"
}

function nullableText(value: string) {
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

const textAreaClassName =
  "min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export { InvitationForm }
