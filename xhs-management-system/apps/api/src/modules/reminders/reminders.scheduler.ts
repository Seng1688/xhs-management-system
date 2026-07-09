import cron from "node-cron"

import { sendTwoDaysBeforeVisitReminders } from "./reminders.service.js"

const REMINDER_CRON = "0 15 * * *"
const TIME_ZONE = "Asia/Kuala_Lumpur"

function startReminderScheduler() {
  const task = cron.schedule(
    REMINDER_CRON,
    () => {
      void sendTwoDaysBeforeVisitReminders()
        .then((result) => {
          console.log(
            `Two-days-before visit reminders finished: sent=${result.sent}, skipped=${result.skipped}, failed=${result.failed}`
          )
        })
        .catch((error) => {
          console.warn(
            error instanceof Error
              ? error.message
              : "Two-days-before visit reminders failed with an unknown error"
          )
        })
    },
    {
      timezone: TIME_ZONE,
    }
  )

  return task
}

export { startReminderScheduler }
