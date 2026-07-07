import { Router } from "express"

import {
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
} from "./content.controller.js"

const contentRouter: ReturnType<typeof Router> = Router()

contentRouter.get("/invitations", listContentInvitationsController)
contentRouter.get(
  "/invitations/:invitationId",
  getContentByInvitationController
)
contentRouter.post(
  "/invitations/:invitationId",
  createContentForInvitationController
)
contentRouter.post(
  "/invitations/:invitationId/ensure",
  ensureContentForInvitationController
)
contentRouter.patch("/:contentId", updateContentController)

contentRouter.get("/assistant-settings/default", getAssistantSettingsController)
contentRouter.patch(
  "/assistant-settings/default",
  updateAssistantSettingsController
)

contentRouter.post("/:contentId/ai-sessions", startAiSessionController)
contentRouter.get("/ai-sessions/:sessionId", getAiSessionController)
contentRouter.post("/ai-sessions/:sessionId/messages", addAiMessageController)

export { contentRouter }
