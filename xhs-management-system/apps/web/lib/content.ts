import type { InvitationStatus, VisitType } from "@/lib/invitations"

type Content = {
  body: string
  createdAt: string
  id: string
  invitationId: string
  tags: string[]
  title: string
  updatedAt: string
}

type ContentInvitation = {
  address: string | null
  createdAt: string
  id: string
  shopName: string
  status: InvitationStatus
  visitDatetime: string | null
  visitType: VisitType
}

type ContentInvitationItem = {
  content: Content | null
  invitation: ContentInvitation
}

type ContentInput = {
  body: string
  tags: string[]
  title: string
}

type AssistantSettings = {
  bannedWords: string[]
  id: string
  language: string
  maxWords: number
  minWords: number
  outputPrompt: string
  tone: string
  updatedAt: string
}

type ContentAiMessage = {
  changeSummary: {
    body: string[]
    tags: string[]
    title: string[]
  } | null
  generatedBody: string | null
  generatedTags: string[] | null
  generatedTitle: string | null
  id: string
  message: string
  role: "user" | "assistant"
}

type ContentAiSession = {
  messages: ContentAiMessage[]
  session: {
    contentId: string
    id: string
    invitationId: string
    overview: string
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function getContentInvitations() {
  const response = await fetch(`${apiUrl}/content/invitations`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { items: ContentInvitationItem[] }
}

async function ensureContentForInvitation(invitationId: string) {
  const response = await fetch(
    `${apiUrl}/content/invitations/${invitationId}/ensure`,
    { method: "POST" }
  )

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { content: Content }
}

async function saveContentForInvitation(
  invitationId: string,
  input: ContentInput
) {
  const response = await fetch(`${apiUrl}/content/invitations/${invitationId}`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { content: Content }
}

async function updateContent(contentId: string, input: ContentInput) {
  const response = await fetch(`${apiUrl}/content/${contentId}`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { content: Content }
}

async function getAssistantSettings() {
  const response = await fetch(`${apiUrl}/content/assistant-settings/default`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { settings: AssistantSettings }
}

async function updateAssistantSettings(
  input: Omit<AssistantSettings, "id" | "updatedAt">
) {
  const response = await fetch(`${apiUrl}/content/assistant-settings/default`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { settings: AssistantSettings }
}

async function startContentAiSession(contentId: string, overview: string) {
  const response = await fetch(`${apiUrl}/content/${contentId}/ai-sessions`, {
    body: JSON.stringify({ overview }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as ContentAiSession
}

async function sendContentAiMessage(sessionId: string, message: string) {
  const response = await fetch(
    `${apiUrl}/content/ai-sessions/${sessionId}/messages`,
    {
      body: JSON.stringify({ message }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as ContentAiSession
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
  ensureContentForInvitation,
  getAssistantSettings,
  getContentInvitations,
  saveContentForInvitation,
  sendContentAiMessage,
  startContentAiSession,
  updateAssistantSettings,
  updateContent,
  type AssistantSettings,
  type Content,
  type ContentAiMessage,
  type ContentAiSession,
  type ContentInput,
  type ContentInvitationItem,
}
