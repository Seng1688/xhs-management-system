import cors from "cors"
import { sql } from "drizzle-orm"
import express from "express"

import { db } from "./db/client.js"
import { aiRouter } from "./modules/ai/ai.routes.js"
import { authRouter } from "./modules/auth/auth.routes.js"
import { contentRouter } from "./modules/content/content.routes.js"
import { invitationsRouter } from "./modules/invitations/invitations.routes.js"
import { joinersRouter } from "./modules/joiners/joiners.routes.js"
import { meRouter } from "./modules/me/me.routes.js"
import { shopSearchRouter } from "./modules/shop-search/shop-search.routes.js"

const app: ReturnType<typeof express> = express()

app.use(
  cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  }),
)
app.use(express.json())
app.use("/ai", aiRouter)
app.use("/auth", authRouter)
app.use("/content", contentRouter)
app.use("/invitations", invitationsRouter)
app.use("/joiners", joinersRouter)
app.use("/me", meRouter)
app.use("/shop-search", shopSearchRouter)
app.use("/uploads", express.static(new URL("../uploads", import.meta.url).pathname))

app.get("/", (_req, res) => {
  res.json({
    message: "XHS Management System API",
    status: "ok",
  })
})

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.get("/health/db", async (_req, res) => {
  try {
    await db.execute(sql`select 1`)

    res.json({
      database: "ok",
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(503).json({
      database: "error",
      message: error instanceof Error ? error.message : "Unknown database error",
      status: "error",
    })
  }
})

export { app }; 
