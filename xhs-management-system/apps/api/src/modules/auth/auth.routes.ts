import { Router } from "express"

import {
  loginController,
  logoutController,
  meController,
} from "./auth.controller.js"

const authRouter: ReturnType<typeof Router> = Router()

authRouter.post("/login", loginController)
authRouter.get("/me", meController)
authRouter.post("/logout", logoutController)

export { authRouter }
