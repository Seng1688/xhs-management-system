type MeProfile = {
  profileImageUrl: string | null
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function getMeProfile() {
  const response = await fetch(`${apiUrl}/me/profile`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const profile = (await response.json()) as MeProfile

  return {
    profileImageUrl: toAbsoluteApiUrl(profile.profileImageUrl),
  }
}

async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.set("profileImage", file)

  const response = await fetch(`${apiUrl}/me/profile-image`, {
    body: formData,
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  const profile = (await response.json()) as MeProfile

  return {
    profileImageUrl: toAbsoluteApiUrl(profile.profileImageUrl),
  }
}

function toAbsoluteApiUrl(value: string | null) {
  if (!value) {
    return null
  }

  return value.startsWith("http") ? value : `${apiUrl}${value}`
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message ?? "Unable to update profile."
  } catch {
    return "Unable to update profile."
  }
}

export { getMeProfile, uploadProfileImage, type MeProfile }
