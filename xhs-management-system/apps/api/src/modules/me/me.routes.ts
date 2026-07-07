import { mkdir } from "node:fs/promises"
import multer from "multer"
import { fileURLToPath } from "node:url"
import { Router } from "express"

import {
  getMeProfileController,
  uploadProfileImageController,
} from "./me.controller.js"
import {
  getProfileImageFileName,
  getProfileUploadDirectory,
} from "./me.service.js"

const uploadDirectory = fileURLToPath(getProfileUploadDirectory())

await mkdir(uploadDirectory, { recursive: true })

const upload = multer({
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed."))
      return
    }

    callback(null, true)
  },
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, getProfileImageFileName(file.originalname))
    },
  }),
})

const meRouter: ReturnType<typeof Router> = Router()

meRouter.get("/profile", getMeProfileController)
meRouter.post(
  "/profile-image",
  upload.single("profileImage"),
  uploadProfileImageController
)

export { meRouter }
