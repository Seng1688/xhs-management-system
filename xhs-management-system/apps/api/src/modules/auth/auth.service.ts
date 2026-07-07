import { eq } from "drizzle-orm"
import { createHmac, timingSafeEqual } from "node:crypto"

import { db } from "../../db/client.js"
import { users } from "../../db/schema/index.js"
import type { LoginDto } from "./auth.dto.js"

type AuthenticatedUser = {
  id: string
  username: string
}

const sessionCookieName = "xhs_session"
const sessionMaxAgeMs = 7 * 24 * 60 * 60 * 1000

async function loginUser({
  password,
  username,
}: LoginDto): Promise<AuthenticatedUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      password: users.password,
      username: users.username,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user || user.password !== password) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
  }
}

async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return user ?? null
}

function createSessionToken(user: AuthenticatedUser) {
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Date.now() + sessionMaxAgeMs,
      userId: user.id,
    })
  )
  const signature = sign(payload)

  return `${payload}.${signature}`
}

function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const [payload, signature] = token.split(".")

  if (!payload || !signature || !isValidSignature(payload, signature)) {
    return null
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as {
      exp?: unknown
      userId?: unknown
    }

    if (
      typeof parsed.exp !== "number" ||
      typeof parsed.userId !== "string" ||
      parsed.exp < Date.now()
    ) {
      return null
    }

    return {
      userId: parsed.userId,
    }
  } catch {
    return null
  }
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? "xhs-management-local-dev-secret"
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url")
}

function isValidSignature(payload: string, signature: string) {
  const expected = sign(payload)
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  )
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

export {
  createSessionToken,
  getUserById,
  loginUser,
  sessionCookieName,
  sessionMaxAgeMs,
  verifySessionToken,
  type AuthenticatedUser,
}
