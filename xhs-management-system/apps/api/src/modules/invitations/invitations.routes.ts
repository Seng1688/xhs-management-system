import { Router, type Router as ExpressRouter } from "express"

import {
  createInvitationController,
  deleteInvitationController,
  listInvitationsController,
  updateInvitationController,
} from "./invitations.controller.js"

const invitationsRouter: ExpressRouter = Router()

invitationsRouter.get("/", listInvitationsController)
invitationsRouter.post("/", createInvitationController)
invitationsRouter.patch("/:id", updateInvitationController)
invitationsRouter.delete("/:id", deleteInvitationController)

export { invitationsRouter }
