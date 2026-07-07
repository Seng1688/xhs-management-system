type LoginCredentials = {
  password: string
  username: string
}

type LoginResponse = {
  user?: {
    id: string
    username: string
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function login(credentials: LoginCredentials) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    body: JSON.stringify(credentials),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getLoginErrorMessage(response))
  }

  return (await response.json()) as LoginResponse
}

async function getCurrentUser() {
  const response = await fetch(`${apiUrl}/auth/me`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Not authenticated.")
  }

  return (await response.json()) as LoginResponse
}

async function logout() {
  const response = await fetch(`${apiUrl}/auth/logout`, {
    credentials: "include",
    method: "POST",
  })

  if (!response.ok) {
    throw new Error("Unable to logout.")
  }
}

async function getLoginErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message ?? "Unable to sign in. Check your credentials."
  } catch {
    return "Unable to sign in. Check your credentials."
  }
}

export { getCurrentUser, login, logout, type LoginCredentials, type LoginResponse }
