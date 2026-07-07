import type { RequestHandler } from "express"

import {
  parseCreateJoinerDto,
  parseUpdateJoinerDto,
} from "./joiners.dto.js"
import {
  JoinerConflictError,
  createJoiner,
  deleteJoiner,
  listJoiners,
  updateJoiner,
} from "./joiners.service.js"

const listJoinersController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ joiners: await listJoiners() })
  } catch (error) {
    next(error)
  }
}

const createJoinerController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseCreateJoinerDto(req.body)

    if (parsed.ok === false) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const joiner = await createJoiner(parsed.data)

    res.status(201).json({ joiner })
  } catch (error) {
    if (error instanceof JoinerConflictError) {
      res.status(409).json({ message: error.message })
      return
    }

    next(error)
  }
}

const updateJoinerController: RequestHandler = async (req, res, next) => {
  try {
    const id = getIdParam(req.params.id)

    if (!id) {
      res.status(400).json({ message: "Joiner id is required." })
      return
    }

    const parsed = parseUpdateJoinerDto(req.body)

    if (parsed.ok === false) {
      res.status(400).json({ message: parsed.message })
      return
    }

    const joiner = await updateJoiner(id, parsed.data)

    if (!joiner) {
      res.status(404).json({ message: "Joiner not found." })
      return
    }

    res.json({ joiner })
  } catch (error) {
    if (error instanceof JoinerConflictError) {
      res.status(409).json({ message: error.message })
      return
    }

    next(error)
  }
}

const deleteJoinerController: RequestHandler = async (req, res, next) => {
  try {
    const id = getIdParam(req.params.id)

    if (!id) {
      res.status(400).json({ message: "Joiner id is required." })
      return
    }

    const joiner = await deleteJoiner(id)

    if (!joiner) {
      res.status(404).json({ message: "Joiner not found." })
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
  createJoinerController,
  deleteJoinerController,
  listJoinersController,
  updateJoinerController,
}
