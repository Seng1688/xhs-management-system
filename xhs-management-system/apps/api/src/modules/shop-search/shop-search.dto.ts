import { z } from "zod"

import { parseDto, type DtoParseResult } from "../common/dto.js"

const firstQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined
  }

  return typeof value === "string" ? value : undefined
}

const searchShopsSchema = z.object({
  near: z
    .preprocess(firstQueryValue, z.string().trim().optional())
    .transform((value) => value || undefined),
  query: z.preprocess(
    firstQueryValue,
    z
      .string({
        error: "Shop name must be at least 2 characters.",
      })
      .trim()
      .min(2, "Shop name must be at least 2 characters.")
  ),
})

type SearchShopsDto = z.infer<typeof searchShopsSchema>

function parseSearchShopsDto(
  query: Record<string, unknown>
): DtoParseResult<SearchShopsDto> {
  return parseDto(searchShopsSchema, query)
}

export { parseSearchShopsDto, type SearchShopsDto }
