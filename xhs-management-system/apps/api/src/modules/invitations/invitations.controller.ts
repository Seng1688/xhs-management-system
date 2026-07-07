import type { RequestHandler } from "express"

import {
  parseCreateInvitationDto,
  parseInvitationFilters,
  parseUpdateInvitationDto,
} from "./invitations.dto.js"
import {
  createInvitation,
  deleteInvitation,
  listInvitations,
  updateInvitation,
} from "./invitations.service.js"

const listInvitationsController: RequestHandler = async (req, res, next) => {
  try {
    const invitations = await listInvitations(parseInvitationFilters(req.query))

    res.json({ invitations })
  } catch (error) {
    next(error)
  }
}

const createInvitationController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseCreateInvitationDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const invitation = await createInvitation(parsed.data)

    res.status(201).json({ invitation })
  } catch (error) {
    next(error)
  }
}

const updateInvitationController: RequestHandler = async (req, res, next) => {
  try {
    const id = getIdParam(req.params.id)

    if (!id) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const parsed = parseUpdateInvitationDto(req.body)

    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const invitation = await updateInvitation(id, parsed.data)

    if (!invitation) {
      res.status(404).json({ message: "Invitation not found." })
      return
    }

    res.json({ invitation })
  } catch (error) {
    next(error)
  }
}

const deleteInvitationController: RequestHandler = async (req, res, next) => {
  try {
    const id = getIdParam(req.params.id)

    if (!id) {
      res.status(400).json({ message: "Invitation id is required." })
      return
    }

    const invitation = await deleteInvitation(id)

    if (!invitation) {
      res.status(404).json({ message: "Invitation not found." })
      return
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

function getIdParam(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null
}

export {
  createInvitationController,
  deleteInvitationController,
  listInvitationsController,
  updateInvitationController,
}
