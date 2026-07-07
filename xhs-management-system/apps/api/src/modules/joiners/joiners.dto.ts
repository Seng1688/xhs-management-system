import { z } from "zod"

import type { NewJoiner } from "../../db/schema/index.js"
import { parseDto, type DtoParseResult } from "../common/dto.js"

type CreateJoinerDto = Pick<NewJoiner, "email" | "name" | "sendEmail">
type UpdateJoinerDto = Partial<Pick<NewJoiner, "email" | "name" | "sendEmail">>

const requiredText = (message: string) =>
  z
    .string({
      error: message,
    })
    .trim()
    .min(1, message)

const emailSchema = requiredText("Email is required.")
  .email("Email is invalid.")
  .transform((email) => email.toLowerCase())

const createJoinerSchema = z.object({
  email: emailSchema,
  name: requiredText("Name is required."),
  sendEmail: z.boolean().default(true),
})

const updateJoinerSchema = z
  .object({
    email: emailSchema.optional(),
    name: requiredText("Name is required.").optional(),
    sendEmail: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.email !== undefined ||
      value.name !== undefined ||
      value.sendEmail !== undefined,
    {
    message: "At least one field is required.",
    }
  )

function parseCreateJoinerDto(body: unknown): DtoParseResult<CreateJoinerDto> {
  return parseDto(createJoinerSchema, body)
}

function parseUpdateJoinerDto(body: unknown): DtoParseResult<UpdateJoinerDto> {
  return parseDto(updateJoinerSchema, body)
}

export {
  parseCreateJoinerDto,
  parseUpdateJoinerDto,
  type CreateJoinerDto,
  type UpdateJoinerDto,
}
