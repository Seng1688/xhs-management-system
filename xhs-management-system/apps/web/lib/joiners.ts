type Joiner = {
  createdAt: string
  email: string
  id: string
  name: string
  sendEmail: boolean
  updatedAt: string
}

type JoinerInput = {
  email: string
  name: string
  sendEmail: boolean
}

type JoinerUpdate = Partial<JoinerInput>

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function getJoiners() {
  const response = await fetch(`${apiUrl}/joiners`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { joiners: Joiner[] }
}

async function createJoiner(input: JoinerInput) {
  const response = await fetch(`${apiUrl}/joiners`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { joiner: Joiner }
}

async function updateJoiner(id: string, input: JoinerUpdate) {
  const response = await fetch(`${apiUrl}/joiners/${id}`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { joiner: Joiner }
}

async function deleteJoiner(id: string) {
  const response = await fetch(`${apiUrl}/joiners/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message ?? "Something went wrong."
  } catch {
    return "Something went wrong."
  }
}

export {
  createJoiner,
  deleteJoiner,
  getJoiners,
  updateJoiner,
  type Joiner,
  type JoinerInput,
  type JoinerUpdate,
}
