import {
  contactRoles,
  invitationStatuses,
  visitTypes,
} from "../../db/schema/index.js"
import { parseDto, type DtoParseResult } from "../common/dto.js"
import { z } from "zod"

const invitationDraftFields = [
  "address",
  "compensation",
  "contactName",
  "contactNumber",
  "contactRole",
  "joinerNames",
  "rawTextBackup",
  "remarks",
  "shopName",
  "status",
  "visitDatetime",
  "visitType",
] as const

const confidenceProperties = Object.fromEntries(
  invitationDraftFields.map((field) => [
    field,
    {
      maximum: 1,
      minimum: 0,
      type: "number",
    },
  ])
) as Record<(typeof invitationDraftFields)[number], {
  maximum: 1
  minimum: 0
  type: "number"
}>

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
)

const analyzeInvitationSchema = z.object({
  additionalPrompt: optionalTextSchema,
  currentDraft: z
    .record(z.string(), z.unknown())
    .optional()
    .catch(undefined),
  rawText: z
    .string({
      error: "Raw invitation text is required.",
    })
    .trim()
    .min(1, "Raw invitation text is required."),
  sessionId: optionalTextSchema,
})

type AnalyzeInvitationDto = z.infer<typeof analyzeInvitationSchema>

function parseAnalyzeInvitationDto(
  body: unknown
): DtoParseResult<AnalyzeInvitationDto> {
  return parseDto(analyzeInvitationSchema, body)
}

const invitationDraftSchema = {
  additionalProperties: false,
  properties: {
    confidence: {
      additionalProperties: false,
      properties: confidenceProperties,
      required: invitationDraftFields,
      type: "object",
    },
    draft: {
      additionalProperties: false,
      properties: {
        address: { type: ["string", "null"] },
        compensation: { type: ["string", "null"] },
        contactName: { type: ["string", "null"] },
        contactNumber: { type: ["string", "null"] },
        contactRole: { enum: [...contactRoles, null] },
        joinerNames: {
          items: { type: "string" },
          type: "array",
        },
        rawTextBackup: { type: ["string", "null"] },
        remarks: { type: ["string", "null"] },
        shopName: { type: ["string", "null"] },
        status: { enum: invitationStatuses },
        visitDatetime: { type: ["string", "null"] },
        visitType: { enum: visitTypes },
      },
      required: invitationDraftFields,
      type: "object",
    },
    shopDescription: { type: ["string", "null"] },
  },
  required: ["draft", "confidence", "shopDescription"],
  type: "object",
} as const

export {
  invitationDraftSchema,
  parseAnalyzeInvitationDto,
  type AnalyzeInvitationDto,
}
