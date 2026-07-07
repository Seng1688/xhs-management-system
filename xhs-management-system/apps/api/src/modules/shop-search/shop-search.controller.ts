import type { RequestHandler } from "express"

import { parseSearchShopsDto } from "./shop-search.dto.js"
import { searchShops } from "./shop-search.service.js"

const searchShopsController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = parseSearchShopsDto(req.query)

    if (parsed.ok === false) {
      res.status(400).json({ message: parsed.message })
      return
    }

    res.json(await searchShops(parsed.data))
  } catch (error) {
    next(error)
  }
}

export { searchShopsController }
