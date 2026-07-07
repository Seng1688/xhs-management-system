import type {
  ContactRole,
  InvitationInput,
  InvitationStatus,
  VisitType,
} from "@/lib/invitations"

type AiInvitationDraft = Partial<
  Omit<InvitationInput, "aiAnalysisSessionId" | "joinerIds">
> & {
  joinerNames?: string[]
}

type AnalyzeInvitationRequest = {
  additionalPrompt?: string
  currentDraft?: AiInvitationDraft
  rawText: string
  sessionId?: string
}

type AnalyzeInvitationResponse = {
  confidence: Record<string, number>
  draft: AiInvitationDraft
  generationIndex: number
  sessionId: string
  shopCandidates: ShopCandidate[]
  shopEnrichment: ShopEnrichment
  shopDescription: string | null
}

type VisitPrepBriefingResponse = {
  generatedAt: string
  html: string
  invitationId: string
  text?: string
}

type ShopEnrichment = {
  message?: string
  status: "error" | "skipped" | "success"
}

type ShopCandidate = {
  address: string
  confidence: number | null
  id: string
  latitude: string | null
  longitude: string | null
  name: string
  phone: string | null
  source: string | null
  sourceUrl: string | null
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function analyzeInvitation(input: AnalyzeInvitationRequest) {
  const response = await fetch(`${apiUrl}/ai/invitations/analyze`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as AnalyzeInvitationResponse
}

async function generateVisitPrepBriefing(invitationId: string) {
  const response = await fetch(
    `${apiUrl}/ai/invitations/${invitationId}/visit-prep-briefing`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as VisitPrepBriefingResponse
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message ?? "Unable to generate invitation draft."
  } catch {
    return "Unable to generate invitation draft."
  }
}

export {
  analyzeInvitation,
  generateVisitPrepBriefing,
  type AiInvitationDraft,
  type AnalyzeInvitationRequest,
  type AnalyzeInvitationResponse,
  type ContactRole,
  type InvitationStatus,
  type ShopCandidate,
  type ShopEnrichment,
  type VisitPrepBriefingResponse,
  type VisitType,
}
