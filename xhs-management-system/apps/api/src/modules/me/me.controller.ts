import type { RequestHandler } from "express"

import { getProfileImageUrl } from "./me.service.js"

const getMeProfileController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({
      profileImageUrl: await getProfileImageUrl(),
    })
  } catch (error) {
    next(error)
  }
}

const uploadProfileImageController: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Profile image is required." })
    return
  }

  res.json({
    profileImageUrl: `/uploads/profile/${req.file.filename}`,
  })
}

export { getMeProfileController, uploadProfileImageController }
