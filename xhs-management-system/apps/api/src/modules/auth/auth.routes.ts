import { Router, type Router as ExpressRouter } from "express"

import {
  loginController,
  logoutController,
  meController,
} from "./auth.controller.js"

const authRouter: ExpressRouter = Router()

authRouter.post("/login", loginController)
authRouter.get("/me", meController)
authRouter.post("/logout", logoutController)

export { authRouter }
