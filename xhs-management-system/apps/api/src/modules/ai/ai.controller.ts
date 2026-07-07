import type { RequestHandler } from "express"

import { parseAnalyzeInvitationDto } from "./ai.dto.js"
import {
  analyzeInvitation,
  generateVisitPrepBriefing,
  triggerApplicationPdfUploadTestWorkflow,
  triggerVisitPrepBriefingTestWorkflow,
} from "./ai.service.js"

const analyzeInvitationController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseAnalyzeInvitationDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    res.json(await analyzeInvitation(parsed.data))
  } catch (error) {
    next(error)
  }
}

const triggerVisitPrepBriefingTestController: RequestHandler = async (
  _req,
  res,
  next
) => {
  try {
    res.json(await triggerVisitPrepBriefingTestWorkflow())
  } catch (error) {
    next(error)
  }
}

const triggerApplicationPdfUploadTestController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email : ""
    const file = req.file

    if (!email.trim()) {
      res.status(400).json({ message: "Email is required." })
      return
    }

    if (!file) {
      res.status(400).json({ message: "PDF file field `file` is required." })
      return
    }

    res.json(await triggerApplicationPdfUploadTestWorkflow({ email, file }))
  } catch (error) {
    next(error)
  }
}

const generateVisitPrepBriefingController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const invitationId = getParam(req.params.invitationId)

    if (!invitationId) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const briefing = await generateVisitPrepBriefing(invitationId)

    if (!briefing) {
      res.status(404).json({ message: "Invitation not found." })
      return
    }

    res.json(briefing)
  } catch (error) {
    next(error)
  }
}

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
}

export {
  analyzeInvitationController,
  generateVisitPrepBriefingController,
  triggerApplicationPdfUploadTestController,
  triggerVisitPrepBriefingTestController,
}
