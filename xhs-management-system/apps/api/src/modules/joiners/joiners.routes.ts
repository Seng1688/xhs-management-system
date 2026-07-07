import { Router, type Router as ExpressRouter } from "express"

import {
  createJoinerController,
  deleteJoinerController,
  listJoinersController,
  updateJoinerController,
} from "./joiners.controller.js"

const joinersRouter: ExpressRouter = Router()

joinersRouter.get("/", listJoinersController)
joinersRouter.post("/", createJoinerController)
joinersRouter.patch("/:id", updateJoinerController)
joinersRouter.delete("/:id", deleteJoinerController)

export { joinersRouter }
