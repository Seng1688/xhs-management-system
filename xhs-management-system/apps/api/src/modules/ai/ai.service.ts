import { desc, eq } from "drizzle-orm"
import { AzureOpenAI } from "openai"
import { randomUUID } from "node:crypto"

import { db } from "../../db/client.js"
import {
  aiAnalysisLogs,
  invitationJoiners,
  invitations,
  joiners,
} from "../../db/schema/index.js"
import {
  invitationDraftSchema,
  type AnalyzeInvitationDto,
} from "./ai.dto.js"
import {
  searchShopCandidatesFromN8n,
  type ShopEnrichment,
  type ShopCandidate,
} from "../shop-enrichment/shop-enrichment.service.js"

type AiInvitationDraft = {
  confidence: Record<string, number>
  draft: Record<string, unknown>
  shopDescription: string | null
}

type AnalyzeInvitationResult = AiInvitationDraft & {
  generationIndex: number
  sessionId: string
  shopCandidates: ShopCandidate[]
  shopEnrichment: ShopEnrichment
}

type VisitPrepBriefingResult = {
  generatedAt: string
  html: string
  invitationId: string
  text?: string
}

const XHS_VISIT_PREP_BRIEFING_PATH = "xhs-ai-visit-prep-briefing"
const XHS_APPLICATION_PDF_UPLOAD_PATH = "xhs-application-pdf-upload"

async function analyzeInvitation({
  additionalPrompt,
  currentDraft,
  rawText,
  sessionId = randomUUID(),
}: AnalyzeInvitationDto): Promise<AnalyzeInvitationResult> {
  const history = await db
    .select({
      additionalPrompt: aiAnalysisLogs.additionalPrompt,
      generationIndex: aiAnalysisLogs.generationIndex,
      responsePayload: aiAnalysisLogs.responsePayload,
    })
    .from(aiAnalysisLogs)
    .where(eq(aiAnalysisLogs.sessionId, sessionId))
    .orderBy(desc(aiAnalysisLogs.generationIndex))
    .limit(5)

  const generationIndex =
    (history[0]?.generationIndex ? history[0].generationIndex : 0) + 1

  const requestPayload = {
    additionalPrompt,
    currentDraft,
    history: [...history].reverse(),
    rawText,
  }

  const responsePayload = await callInvitationLlm(requestPayload)
  const shopCandidates = responsePayload.shopDescription
    ? await searchShopCandidatesFromN8n({
        draft: responsePayload.draft,
        rawText,
        shopDescription: responsePayload.shopDescription,
      })
    : {
        enrichment: {
          message: "AI did not produce a shop description.",
          status: "skipped" as const,
        },
        results: [],
      }

  await db.insert(aiAnalysisLogs).values({
    additionalPrompt,
    generationIndex,
    rawText,
    requestPayload,
    responsePayload,
    sessionId,
  })

  return {
    confidence: responsePayload.confidence,
    draft: responsePayload.draft,
    generationIndex,
    sessionId,
    shopCandidates: shopCandidates.results,
    shopEnrichment: shopCandidates.enrichment,
    shopDescription: responsePayload.shopDescription,
  }
}

async function callInvitationLlm(
  requestPayload: Record<string, unknown>
): Promise<AiInvitationDraft> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT

  if (!apiKey || !endpoint || !apiVersion || !deployment) {
    throw new Error(
      "AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION, and AZURE_OPENAI_CHAT_DEPLOYMENT are required for AI generation."
    )
  }

  const client = new AzureOpenAI({
    apiKey,
    apiVersion,
    deployment,
    endpoint,
  })

  const response = await client.chat.completions.create({
    messages: [
      {
        content: [
          "You are a precise assistant that extracts XHS creator collaboration invitations.",
          "Return only data that matches the provided JSON schema.",
        ].join(" "),
        role: "system",
      },
      {
        content: buildPrompt(requestPayload),
        role: "user",
      },
    ],
    model: deployment,
    response_format: {
      json_schema: {
        name: "invitation_draft",
        schema: invitationDraftSchema,
        strict: true,
      },
      type: "json_schema",
    },
  })

  const outputText = response.choices[0]?.message.content

  if (!outputText) {
    throw new Error("AI response did not include structured output.")
  }

  return normalizeAiDraft(JSON.parse(outputText) as AiInvitationDraft)
}

async function triggerVisitPrepBriefingTestWorkflow() {
  const webhookUrl = getN8nWorkflowUrl(XHS_VISIT_PREP_BRIEFING_PATH)
  const payload = buildVisitPrepBriefingTestPayload()

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(payload),
    headers: buildN8nHeaders(),
    method: "POST",
    signal: AbortSignal.timeout(getN8nTimeoutMs()),
  })

  const responseText = await response.text()
  const responsePayload = parseJsonResponse(responseText)

  if (!response.ok) {
    throw new Error(
      `n8n visit prep briefing workflow failed with ${response.status}: ${responseText}`
    )
  }

  return {
    n8nResponse: responsePayload,
    request: {
      payload,
      webhookUrl,
    },
    status: "success" as const,
  }
}

async function triggerApplicationPdfUploadTestWorkflow({
  email,
  file,
}: {
  email: string
  file: Express.Multer.File
}) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error("Email is required.")
  }

  if (!file) {
    throw new Error("PDF file is required.")
  }

  const webhookUrl = getN8nWorkflowUrl(XHS_APPLICATION_PDF_UPLOAD_PATH)
  const formData = new FormData()
  const fileBlob = new Blob([new Uint8Array(file.buffer)], {
    type: file.mimetype || "application/pdf",
  })

  formData.append("email", normalizedEmail)
  formData.append("file", fileBlob, file.originalname || "application.pdf")

  const response = await fetch(webhookUrl, {
    body: formData,
    headers: buildN8nAuthHeaders(),
    method: "POST",
    signal: AbortSignal.timeout(getN8nTimeoutMs()),
  })

  const responseText = await response.text()
  const responsePayload = parseJsonResponse(responseText)

  if (!response.ok) {
    throw new Error(
      `n8n application PDF upload workflow failed with ${response.status}: ${responseText}`
    )
  }

  return {
    n8nResponse: responsePayload,
    request: {
      email: normalizedEmail,
      file: {
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
      webhookUrl,
    },
    status: "success" as const,
  }
}

async function generateVisitPrepBriefing(
  invitationId: string
): Promise<VisitPrepBriefingResult | null> {
  const invitation = await getInvitationForVisitPrep(invitationId)

  if (!invitation) {
    return null
  }

  const webhookUrl = getN8nWorkflowUrl(XHS_VISIT_PREP_BRIEFING_PATH)
  const payload = buildVisitPrepBriefingPayload(invitation)

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(payload),
    headers: buildN8nHeaders(),
    method: "POST",
    signal: AbortSignal.timeout(getN8nTimeoutMs()),
  })

  const responseText = await response.text()
  const responsePayload = parseJsonResponse(responseText)

  if (!response.ok) {
    throw new Error(
      `n8n visit prep briefing workflow failed with ${response.status}: ${responseText}`
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    html: getBriefingHtml(responsePayload),
    invitationId,
    text: getBriefingText(responsePayload),
  }
}

async function getInvitationForVisitPrep(invitationId: string) {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1)

  if (!invitation) {
    return null
  }

  const invitationJoinerRows = await db
    .select({
      email: joiners.email,
      id: joiners.id,
      name: joiners.name,
      sendEmail: joiners.sendEmail,
    })
    .from(invitationJoiners)
    .innerJoin(joiners, eq(invitationJoiners.joinerId, joiners.id))
    .where(eq(invitationJoiners.invitationId, invitation.id))

  return {
    ...invitation,
    joiners: invitationJoinerRows,
  }
}

function buildVisitPrepBriefingPayload(
  invitation: NonNullable<Awaited<ReturnType<typeof getInvitationForVisitPrep>>>
) {
  return {
    event: "visit.prep.requested",
    invitation: {
      address: invitation.address,
      compensation: invitation.compensation,
      contactName: invitation.contactName,
      contactNumber: invitation.contactNumber,
      contactRole: invitation.contactRole,
      id: invitation.id,
      notes: invitation.remarks,
      rawTextBackup: invitation.rawTextBackup,
      remarks: invitation.remarks,
      shopName: invitation.shopName,
      status: invitation.status,
      visitDatetime: invitation.visitDatetime?.toISOString() ?? null,
      visitType: invitation.visitType,
    },
    joiners: invitation.joiners,
    requestedAt: new Date().toISOString(),
    shop: {
      address: invitation.address,
      name: invitation.shopName,
    },
    source: "dashboard-reminder-panel",
  }
}

function buildVisitPrepBriefingTestPayload() {
  return {
    event: "visit.prep.test",
    invitation: {
      campaign: "July creators tasting round",
      id: "postman-test-invitation-001",
      notes:
        "Owner prefers weekday afternoon visits. Ask about signature menu and posting deadline.",
      shopName: "Sunny Bowl Cafe",
      status: "scheduled",
      visitDatetime: "2026-07-04T06:30:00.000Z",
      visitType: "Food tasting",
    },
    joiners: [
      {
        email: "sam@example.com",
        name: "Sam",
        sendEmail: true,
      },
      {
        email: "creator@example.com",
        name: "Creator Partner",
        sendEmail: true,
      },
      {
        email: null,
        name: "Observer",
        sendEmail: false,
      },
    ],
    shop: {
      address: "Lot G-08, Example Mall, Kuala Lumpur",
      name: "Sunny Bowl Cafe",
    },
    source: "api-postman-test",
    sentAt: new Date().toISOString(),
  }
}

function getN8nWorkflowUrl(path: string) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim()

  if (!webhookUrl) {
    throw new Error("N8N_WEBHOOK_URL is required to call the n8n workflow.")
  }

  return new URL(
    path,
    webhookUrl.endsWith("/") ? webhookUrl : `${webhookUrl}/`
  ).toString()
}

function buildN8nHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (process.env.N8N_AUTH) {
    headers["X-API-KEY"] = process.env.N8N_AUTH
  }

  return headers
}

function buildN8nAuthHeaders() {
  const headers: Record<string, string> = {}

  if (process.env.N8N_AUTH) {
    headers["X-API-KEY"] = process.env.N8N_AUTH
  }

  return headers
}

function getN8nTimeoutMs() {
  const rawTimeout = Number(process.env.N8N_SHOP_SEARCH_TIMEOUT_MS)

  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 60000
}

function parseJsonResponse(responseText: string) {
  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    return responseText
  }
}

function getBriefingHtml(payload: unknown) {
  const html = firstStringFromPayload(payload, "html", "briefing", "output")

  if (html) {
    return stripHtmlCodeFence(html)
  }

  return "<section><h2>Visit prep briefing</h2><p>No briefing content was returned by n8n.</p></section>"
}

function getBriefingText(payload: unknown) {
  return firstStringFromPayload(payload, "text", "briefing", "output") ?? undefined
}

function firstStringFromPayload(
  payload: unknown,
  ...keys: string[]
): string | null {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload.trim()
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const value: string | null = firstStringFromPayload(item, ...keys)

      if (value) {
        return value
      }
    }
  }

  if (!payload || typeof payload !== "object") {
    return null
  }

  const record = payload as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  if (record.rawAgentResult) {
    return firstStringFromPayload(record.rawAgentResult, ...keys)
  }

  return null
}

function stripHtmlCodeFence(value: string) {
  return value
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function buildPrompt(requestPayload: Record<string, unknown>) {
  return [
    "Extract a creator collaboration invitation into the JSON schema.",
    "Use null when data is unknown. Do not invent facts.",
    "For remarks and compensation, keep content simple, short, precise, and in point form.",
    "For compensation , use format <compensation 1> + <compensation 2> + ... if multiple compensation types are provided., use `x number of pax` if the compensation is per person.",
    "Format remarks exactly as two sections: `Pre-visit\n<short bullet points or blank>\n\nPost-visit\n<short bullet points or blank>`.",
    "Under Pre-visit, include all before-visit notes the XHS blogger should know.",
    "Pre-visit examples: visit instructions, recommended time interval to visit, pax limitations, signature food or recommended menu items, and any other before-visit instructions.",
    "Under Post-visit, include actions required by the shop owner or collaboration contact after the visit.",
    "Post-visit examples: Google review, IG story, required post, caption/review approval before posting, specified tags or mentions, posting deadlines, and any additional action to perform.",
    "Set shopDescription to a concise search query using shop name, branch, area, mall, landmark, cuisine, and any location hints from the raw text. Do not invent missing details.",
    "If regeneration history is provided, improve the previous draft using the additional prompt.",
    "Preferred to write in Simplified Chinese, but if the raw text is in English, write in English.",
    `Request payload:\n${JSON.stringify(requestPayload, null, 2)}`,
  ].join("\n\n")
}

function normalizeAiDraft(payload: AiInvitationDraft): AiInvitationDraft {
  return {
    confidence: payload.confidence ?? {},
    draft: {
      ...payload.draft,
      rawTextBackup:
        typeof payload.draft.rawTextBackup === "string"
          ? payload.draft.rawTextBackup
          : null,
    },
    shopDescription:
      typeof payload.shopDescription === "string" &&
      payload.shopDescription.trim().length > 0
        ? payload.shopDescription.trim()
        : null,
  }
}

export {
  analyzeInvitation,
  generateVisitPrepBriefing,
  triggerApplicationPdfUploadTestWorkflow,
  triggerVisitPrepBriefingTestWorkflow,
}
