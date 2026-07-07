import { z } from "zod"

import { parseDto, type DtoParseResult } from "../common/dto.js"

const loginSchema = z.object({
  password: z.string({
    error: "Username and password are required.",
  }),
  username: z.string({
    error: "Username and password are required.",
  }),
})

type LoginDto = z.infer<typeof loginSchema>

function parseLoginDto(body: unknown): DtoParseResult<LoginDto> {
  return parseDto(loginSchema, body)
}

export { parseLoginDto, type LoginDto }
