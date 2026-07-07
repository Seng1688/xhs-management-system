import cron from "node-cron"

import { sendDayBeforeVisitReminders } from "./reminders.service.js"

const REMINDER_CRON = "0 11 * * *"
const TIME_ZONE = "Asia/Kuala_Lumpur"

function startReminderScheduler() {
  const task = cron.schedule(
    REMINDER_CRON,
    () => {
      void sendDayBeforeVisitReminders()
        .then((result) => {
          console.log(
            `Day-before visit reminders finished: sent=${result.sent}, skipped=${result.skipped}, failed=${result.failed}`
          )
        })
        .catch((error) => {
          console.warn(
            error instanceof Error
              ? error.message
              : "Day-before visit reminders failed with an unknown error"
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
