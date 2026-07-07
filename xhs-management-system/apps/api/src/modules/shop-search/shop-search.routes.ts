import { Router, type Router as ExpressRouter } from "express"

import { searchShopsController } from "./shop-search.controller.js"

const shopSearchRouter: ExpressRouter = Router()

shopSearchRouter.get("/", searchShopsController)

export { shopSearchRouter }
