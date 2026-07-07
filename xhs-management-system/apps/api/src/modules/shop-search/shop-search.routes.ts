import { Router } from "express"

import { searchShopsController } from "./shop-search.controller.js"

const shopSearchRouter: ReturnType<typeof Router> = Router()

shopSearchRouter.get("/", searchShopsController)

export { shopSearchRouter }
