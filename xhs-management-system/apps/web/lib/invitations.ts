type VisitType = "F&B" | "Service" | "Product"
type ContactRole = "Agent" | "Owner" | "Other"
type InvitationStatus =
  | "Pending Review"
  | "Scheduled"
  | "Completed"
  | "Declined"

type InvitationJoiner = {
  email: string
  id: string
  name: string
}

type Invitation = {
  address: string | null
  compensation: string | null
  contactName: string | null
  contactNumber: string | null
  contactRole: ContactRole | null
  createdAt: string
  id: string
  joiners: InvitationJoiner[]
  rawTextBackup: string | null
  remarks: string | null
  shopName: string
  status: InvitationStatus
  updatedAt: string
  visitDatetime: string | null
  visitType: VisitType
}

type InvitationFilters = {
  search?: string
  status?: InvitationStatus | "all"
  visitType?: VisitType | "all"
}

type InvitationInput = {
  aiAnalysisSessionId?: string
  address?: string | null
  compensation?: string | null
  contactName?: string | null
  contactNumber?: string | null
  contactRole?: ContactRole | null
  joinerIds?: string[]
  rawTextBackup?: string | null
  remarks?: string | null
  shopName: string
  status: InvitationStatus
  visitDatetime?: string | null
  visitType: VisitType
}

type InvitationUpdate = Partial<InvitationInput>

const visitTypes: VisitType[] = ["F&B", "Service", "Product"]
const contactRoles: ContactRole[] = ["Agent", "Owner", "Other"]
const invitationStatuses: InvitationStatus[] = [
  "Pending Review",
  "Scheduled",
  "Completed",
]

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function getInvitations(filters: InvitationFilters = {}) {
  const params = new URLSearchParams()

  if (filters.search) {
    params.set("search", filters.search)
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status)
  }

  if (filters.visitType && filters.visitType !== "all") {
    params.set("visitType", filters.visitType)
  }

  const query = params.toString()
  const response = await fetch(`${apiUrl}/invitations${query ? `?${query}` : ""}`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { invitations: Invitation[] }
}

async function createInvitation(input: InvitationInput) {
  const response = await fetch(`${apiUrl}/invitations`, {
    body: JSON.stringify(normalizeInvitationInput(input)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { invitation: Invitation }
}

async function updateInvitation(id: string, input: InvitationUpdate) {
  const response = await fetch(`${apiUrl}/invitations/${id}`, {
    body: JSON.stringify(normalizeInvitationInput(input)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { invitation: Invitation }
}

async function deleteInvitation(id: string) {
  const response = await fetch(`${apiUrl}/invitations/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }
}

function normalizeInvitationInput(input: InvitationUpdate) {
  if (!("visitDatetime" in input)) {
    return input
  }

  return {
    ...input,
    visitDatetime: input.visitDatetime
      ? new Date(input.visitDatetime).toISOString()
      : null,
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
  contactRoles,
  createInvitation,
  deleteInvitation,
  getInvitations,
  invitationStatuses,
  updateInvitation,
  visitTypes,
  type ContactRole,
  type Invitation,
  type InvitationFilters,
  type InvitationInput,
  type InvitationJoiner,
  type InvitationStatus,
  type InvitationUpdate,
  type VisitType,
}
