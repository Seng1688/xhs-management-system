import multer from "multer"
import { Router } from "express"

import {
  analyzeInvitationController,
  generateVisitPrepBriefingController,
  triggerApplicationPdfUploadTestController,
  triggerVisitPrepBriefingTestController,
} from "./ai.controller.js"

const aiRouter: ReturnType<typeof Router> = Router()
const uploadApplicationPdf = multer({
  fileFilter: (_req, file, callback) => {
    if (
      file.mimetype !== "application/pdf" &&
      !file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      callback(new Error("Only PDF uploads are allowed."))
      return
    }

    callback(null, true)
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
})

aiRouter.post("/invitations/analyze", analyzeInvitationController)
aiRouter.post(
  "/invitations/:invitationId/visit-prep-briefing",
  generateVisitPrepBriefingController
)
aiRouter.post(
  "/workflows/visit-prep/test",
  triggerVisitPrepBriefingTestController
)
aiRouter.post(
  "/workflows/application-pdf-upload/test",
  uploadApplicationPdf.single("file"),
  triggerApplicationPdfUploadTestController
)

export { aiRouter }
