import { z } from "zod"

import type { ContentAssistantConfigSnapshot } from "../../db/schema/index.js"
import { parseDto, type DtoParseResult } from "../common/dto.js"

type AssistantSettingsDto = ContentAssistantConfigSnapshot

const requiredText = (label: string) =>
  z
    .string({
      error: `${label} is required.`,
    })
    .trim()
    .min(1, `${label} is required.`)

const positiveInteger = (label: string) =>
  z.coerce
    .number({
      error: `${label} must be a positive integer.`,
    })
    .int(`${label} must be a positive integer.`)
    .positive(`${label} must be a positive integer.`)

const tagsSchema = z
  .array(z.string({ error: "Tags must be text." }), {
    error: "Tags must be an array.",
  })
  .transform((tags) =>
    tags
      .map((item) => item.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
  )

const stringArraySchema = (label: string) =>
  z
    .union([
      z.string(),
      z.array(z.string({ error: `${label} must contain text only.` }), {
        error: `${label} must be an array.`,
      }),
    ])
    .transform((value) => {
      const items =
        typeof value === "string" ? value.split(/[\n,]/) : value

      return items.map((item) => item.trim()).filter(Boolean)
    })

const contentInputSchema = z.object({
  body: requiredText("Body"),
  tags: tagsSchema,
  title: requiredText("Title"),
})

const assistantSettingsSchema = z
  .object({
    bannedWords: stringArraySchema("Banned words").optional(),
    language: requiredText("Language").optional(),
    maxWords: positiveInteger("Maximum words").optional(),
    minWords: positiveInteger("Minimum words").optional(),
    outputPrompt: requiredText("Output prompt").optional(),
    tone: requiredText("Tone").optional(),
  })
  .refine(
    (data) =>
      data.minWords === undefined ||
      data.maxWords === undefined ||
      data.minWords <= data.maxWords,
    {
      message: "Minimum words cannot be greater than maximum words.",
      path: ["minWords"],
    }
  )

const startAiSessionSchema = z.object({
  overview: requiredText("Overview"),
})

const addAiMessageSchema = z.object({
  message: requiredText("Message"),
})

type ContentInputDto = z.infer<typeof contentInputSchema>
type StartAiSessionDto = z.infer<typeof startAiSessionSchema>
type AddAiMessageDto = z.infer<typeof addAiMessageSchema>

function parseContentInputDto(body: unknown): DtoParseResult<ContentInputDto> {
  return parseDto(contentInputSchema, body)
}

function parseAssistantSettingsDto(
  body: unknown
): DtoParseResult<Partial<AssistantSettingsDto>> {
  return parseDto(assistantSettingsSchema, body)
}

function parseStartAiSessionDto(
  body: unknown
): DtoParseResult<StartAiSessionDto> {
  return parseDto(startAiSessionSchema, body)
}

function parseAddAiMessageDto(body: unknown): DtoParseResult<AddAiMessageDto> {
  return parseDto(addAiMessageSchema, body)
}

export {
  parseAddAiMessageDto,
  parseAssistantSettingsDto,
  parseContentInputDto,
  parseStartAiSessionDto,
  type AddAiMessageDto,
  type AssistantSettingsDto,
  type ContentInputDto,
  type StartAiSessionDto,
}
