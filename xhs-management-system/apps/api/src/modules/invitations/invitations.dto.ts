import { z } from "zod"

import {
  contactRoles,
  invitationStatuses,
  type NewInvitation,
  visitTypes,
} from "../../db/schema/index.js"
import { parseDto, type DtoParseResult } from "../common/dto.js"

type InvitationFiltersDto = {
  search: string
  status?: NewInvitation["status"]
  visitType?: NewInvitation["visitType"]
}

type CreateInvitationDto = {
  aiAnalysisSessionId?: string
  invitation: NewInvitation
  joinerIds: string[]
}

type UpdateInvitationDto = {
  invitation: Partial<NewInvitation>
  joinerIds?: string[]
}

const requiredText = (message: string) =>
  z
    .string({
      error: message,
    })
    .trim()
    .min(1, message)

const optionalText = z.preprocess(
  (value) => (typeof value === "string" ? value : undefined),
  z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
)

const nullableText = (field: string) =>
  z
    .custom<string | null>(
      (value) => typeof value === "string" || value === null,
      `${field} must be text.`
    )
    .transform((value) => {
      if (value === null) {
        return null
      }

      const trimmed = value.trim()

      return trimmed.length > 0 ? trimmed : null
    })

const visitTypeSchema = z.enum(visitTypes, {
  error: "Visit type must be F&B, Service, or Product.",
})
const statusSchema = z.enum(invitationStatuses, {
  error: "Status is invalid.",
})
const contactRoleSchema = z.enum(contactRoles, {
  error: "Contact role is invalid.",
})

const nullableContactRole = z
  .union([contactRoleSchema, z.literal(""), z.null()], {
    error: "Contact role is invalid.",
  })
  .transform((value) => (value === "" ? null : value))

const nullableDate = z
  .custom<string | null>(
    (value) => typeof value === "string" || value === null,
    "Visit date/time is invalid."
  )
  .transform((value, context) => {
    if (value === null || value === "") {
      return null
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Visit date/time is invalid.",
      })

      return z.NEVER
    }

    return date
  })

const joinerIdsSchema = z
  .array(z.uuid("Joiners are invalid."), {
    error: "Joiners are invalid.",
  })
  .transform((ids) => Array.from(new Set(ids)))

const invitationFieldsSchema = z.object({
  address: nullableText("address").optional(),
  compensation: nullableText("compensation").optional(),
  contactName: nullableText("contactName").optional(),
  contactNumber: nullableText("contactNumber").optional(),
  contactRole: nullableContactRole.optional(),
  rawTextBackup: nullableText("rawTextBackup").optional(),
  remarks: nullableText("remarks").optional(),
  shopName: requiredText("Shop name is required.").optional(),
  status: statusSchema.optional(),
  visitDatetime: nullableDate.optional(),
  visitType: visitTypeSchema.optional(),
})

const createInvitationBodySchema = invitationFieldsSchema
  .required({
    shopName: true,
    status: true,
    visitType: true,
  })
  .extend({
    aiAnalysisSessionId: optionalText,
    joinerIds: joinerIdsSchema.optional(),
  })

const updateInvitationBodySchema = invitationFieldsSchema.extend({
  joinerIds: joinerIdsSchema.optional(),
})

function parseInvitationFilters(query: {
  search?: unknown
  status?: unknown
  visitType?: unknown
}): InvitationFiltersDto {
  return {
    search: typeof query.search === "string" ? query.search.trim() : "",
    status: statusSchema.safeParse(query.status).data,
    visitType: visitTypeSchema.safeParse(query.visitType).data,
  }
}

function parseCreateInvitationDto(
  body: unknown
): DtoParseResult<CreateInvitationDto> {
  const parsed = parseDto(createInvitationBodySchema, body)

  if (parsed.ok === false) {
    return {
      message: parsed.message,
      ok: false,
    }
  }

  const { aiAnalysisSessionId, joinerIds, ...invitation } = parsed.data

  return {
    data: {
      aiAnalysisSessionId,
      invitation: invitation as NewInvitation,
      joinerIds: joinerIds ?? [],
    },
    ok: true,
  }
}

function parseUpdateInvitationDto(
  body: unknown
): DtoParseResult<UpdateInvitationDto> {
  const parsed = parseDto(updateInvitationBodySchema, body)

  if (parsed.ok === false) {
    return {
      message: parsed.message,
      ok: false,
    }
  }

  const { joinerIds, ...invitation } = parsed.data

  return {
    data: {
      invitation,
      joinerIds,
    },
    ok: true,
  }
}

export {
  parseCreateInvitationDto,
  parseInvitationFilters,
  parseUpdateInvitationDto,
  type CreateInvitationDto,
  type InvitationFiltersDto,
  type UpdateInvitationDto,
}
