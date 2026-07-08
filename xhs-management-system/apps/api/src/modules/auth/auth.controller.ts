import type { RequestHandler } from "express"

import { parseLoginDto } from "./auth.dto.js"
import {
  createSessionToken,
  getUserById,
  loginUser,
  sessionCookieName,
  sessionMaxAgeMs,
  verifySessionToken,
} from "./auth.service.js"

const loginController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseLoginDto(req.body)

    if (parsed.ok === false) {
      res.status(400).json({
        message: parsed.message,
      })
      return
    }

    const user = await loginUser(parsed.data)

    if (!user) {
      res.status(401).json({
        message: "Invalid username or password.",
      })
      return
    }

    res.cookie(sessionCookieName, createSessionToken(user), {
      ...getCookieOptions(),
      maxAge: sessionMaxAgeMs,
    })
    res.json({ user })
  } catch (error) {
    next(error)
  }
}

const meController: RequestHandler = async (req, res, next) => {
  try {
    const session = verifySessionToken(getCookie(req.headers.cookie, sessionCookieName))

    if (!session) {
      res.status(401).json({ message: "Not authenticated." })
      return
    }

    const user = await getUserById(session.userId)

    if (!user) {
      res.clearCookie(sessionCookieName, getCookieOptions())
      res.status(401).json({ message: "Not authenticated." })
      return
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

const logoutController: RequestHandler = (_req, res) => {
  res.clearCookie(sessionCookieName, getCookieOptions())
  res.status(204).send()
}

function getCookie(header: string | undefined, name: string) {
  if (!header) {
    return undefined
  }

  const cookies = header.split(";")

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=")

    if (key === name) {
      return decodeURIComponent(value.join("="))
    }
  }

  return undefined
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production"

  return {
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
  }
}

export { loginController, logoutController, meController }
