import { z } from "zod"

type DtoParseResult<T> =
  | { data: T; ok: true }
  | { message: string; ok: false }

function parseDto<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  fallbackMessage = "Invalid request body."
): DtoParseResult<z.output<Schema>> {
  const parsed = schema.safeParse(input)

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? fallbackMessage,
      ok: false,
    }
  }

  return { data: parsed.data, ok: true }
}

export { parseDto, type DtoParseResult }
