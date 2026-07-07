import type { RequestHandler } from "express"

import {
  parseAddAiMessageDto,
  parseAssistantSettingsDto,
  parseContentInputDto,
  parseStartAiSessionDto,
} from "./content.dto.js"
import {
  addAiSessionMessage,
  createContentForInvitation,
  ensureContentForInvitation,
  getAiSession,
  getAssistantSettings,
  getContentByInvitation,
  listContentInvitations,
  startAiSession,
  updateAssistantSettings,
  updateContent,
} from "./content.service.js"

const listContentInvitationsController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ items: await listContentInvitations() })
  } catch (error) {
    next(error)
  }
}

const getContentByInvitationController: RequestHandler = async (req, res, next) => {
  try {
    const invitationId = getIdParam(req.params.invitationId)

    if (!invitationId) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const content = await getContentByInvitation(invitationId)

    res.json({ content: content ?? null })
  } catch (error) {
    next(error)
  }
}

const ensureContentForInvitationController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const invitationId = getIdParam(req.params.invitationId)

    if (!invitationId) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const content = await ensureContentForInvitation(invitationId)

    res.status(201).json({ content })
  } catch (error) {
    next(error)
  }
}

const createContentForInvitationController: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const invitationId = getIdParam(req.params.invitationId)

    if (!invitationId) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const parsed = parseContentInputDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const content = await createContentForInvitation(invitationId, parsed.data)

    res.status(201).json({ content })
  } catch (error) {
    next(error)
  }
}

const updateContentController: RequestHandler = async (req, res, next) => {
  try {
    const contentId = getIdParam(req.params.contentId)

    if (!contentId) {
      res.status(400).json({ message: "Content id is required." })
      return
    }

    const parsed = parseContentInputDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const content = await updateContent(contentId, parsed.data)

    if (!content) {
      res.status(404).json({ message: "Content not found." })
      return
    }

    res.json({ content })
  } catch (error) {
    next(error)
  }
}

const getAssistantSettingsController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ settings: await getAssistantSettings() })
  } catch (error) {
    next(error)
  }
}

const updateAssistantSettingsController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseAssistantSettingsDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const settings = await updateAssistantSettings(parsed.data)

    res.json({ settings })
  } catch (error) {
    next(error)
  }
}

const startAiSessionController: RequestHandler = async (req, res, next) => {
  try {
    const contentId = getIdParam(req.params.contentId)

    if (!contentId) {
      res.status(400).json({ message: "Content id is required." })
      return
    }

    const parsed = parseStartAiSessionDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const session = await startAiSession(contentId, parsed.data)

    if (!session) {
      res.status(404).json({ message: "Content not found." })
      return
    }

    res.status(201).json(session)
  } catch (error) {
    next(error)
  }
}

const getAiSessionController: RequestHandler = async (req, res, next) => {
  try {
    const sessionId = getIdParam(req.params.sessionId)

    if (!sessionId) {
      res.status(400).json({ message: "Session id is required." })
      return
    }

    const session = await getAiSession(sessionId)

    if (!session) {
      res.status(404).json({ message: "AI session not found." })
      return
    }

    res.json(session)
  } catch (error) {
    next(error)
  }
}

const addAiMessageController: RequestHandler = async (req, res, next) => {
  try {
    const sessionId = getIdParam(req.params.sessionId)

    if (!sessionId) {
      res.status(400).json({ message: "Session id is required." })
      return
    }

    const parsed = parseAddAiMessageDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const session = await addAiSessionMessage(sessionId, parsed.data)

    if (!session) {
      res.status(404).json({ message: "AI session not found." })
      return
    }

    res.json(session)
  } catch (error) {
    next(error)
  }
}

function getIdParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null
}

export {
  addAiMessageController,
  createContentForInvitationController,
  ensureContentForInvitationController,
  getAiSessionController,
  getAssistantSettingsController,
  getContentByInvitationController,
  listContentInvitationsController,
  startAiSessionController,
  updateAssistantSettingsController,
  updateContentController,
}
