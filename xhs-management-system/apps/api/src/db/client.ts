import { config } from "dotenv"
import { drizzle } from "drizzle-orm/node-postgres"
import { fileURLToPath } from "node:url"
import pg from "pg"

import * as schema from "./schema/index.js"

const { Pool } = pg

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
})

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required to connect to Postgres")
}

const pool = new Pool({
  connectionString,
})

const db = drizzle(pool, { schema })

export { db, pool }
