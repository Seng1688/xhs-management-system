import { readdir } from "node:fs/promises"
import { extname } from "node:path"

const profileUploadDirectory = new URL("../../../uploads/profile/", import.meta.url)

function getProfileUploadDirectory() {
  return profileUploadDirectory
}

async function getProfileImageUrl() {
  const files = await getProfileFiles()
  const profileImage = files[0]

  return profileImage ? `/uploads/profile/${profileImage}` : null
}

async function getProfileFiles() {
  try {
    const files = await readdir(profileUploadDirectory)

    return files
      .filter((file) => file.startsWith("profile."))
      .sort((first, second) => second.localeCompare(first))
  } catch {
    return []
  }
}

function getProfileImageFileName(originalName: string) {
  const extension = extname(originalName).toLowerCase()

  return `profile${extension || ".jpg"}`
}

export {
  getProfileImageFileName,
  getProfileImageUrl,
  getProfileUploadDirectory,
}
