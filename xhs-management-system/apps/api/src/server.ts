import "dotenv/config"

import { app } from "./app.js"
import { pool } from "./db/client.js"
import { startReminderScheduler } from "./modules/reminders/reminders.scheduler.js"

const port = Number(process.env.PORT ?? 4000)

const server = app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
const reminderScheduler = startReminderScheduler()

const shutdown = async () => {
  reminderScheduler.stop()

  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
