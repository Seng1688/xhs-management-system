import { and, desc, eq, ilike, inArray } from "drizzle-orm"

import { db } from "../../db/client.js"
import {
  aiAnalysisLogs,
  invitationJoiners,
  invitations,
  joiners,
  type Invitation,
} from "../../db/schema/index.js"
import type {
  CreateInvitationDto,
  InvitationFiltersDto,
  UpdateInvitationDto,
} from "./invitations.dto.js"

type InvitationWithJoiners = Invitation & {
  joiners: InvitationJoiner[]
}

type InvitationJoiner = {
  email: string
  id: string
  name: string
}

async function listInvitations(filters: InvitationFiltersDto) {
  const whereClauses = [
    filters.visitType ? eq(invitations.visitType, filters.visitType) : undefined,
    filters.status ? eq(invitations.status, filters.status) : undefined,
    filters.search ? ilike(invitations.shopName, `%${filters.search}%`) : undefined,
  ].filter((filter) => filter !== undefined)

  const rows = await db
    .select()
    .from(invitations)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(desc(invitations.createdAt))

  return withJoiners(rows)
}

async function createInvitation({
  aiAnalysisSessionId,
  invitation: data,
  joinerIds,
}: CreateInvitationDto) {
  const invitation = await db.transaction(async (tx) => {
    const [createdInvitation] = await tx
      .insert(invitations)
      .values(data)
      .returning()

    if (!createdInvitation) {
      throw new Error("Failed to create invitation.")
    }

    await syncInvitationJoiners(tx, createdInvitation.id, joinerIds)

    if (aiAnalysisSessionId) {
      await tx
        .update(aiAnalysisLogs)
        .set({
          invitationId: createdInvitation.id,
        })
        .where(eq(aiAnalysisLogs.sessionId, aiAnalysisSessionId))
    }

    return createdInvitation
  })

  const [createdInvitation] = await withJoiners([invitation])

  if (!createdInvitation) {
    throw new Error("Failed to load created invitation.")
  }

  return createdInvitation
}

async function updateInvitation(
  id: string,
  { invitation: data, joinerIds }: UpdateInvitationDto
): Promise<InvitationWithJoiners | undefined> {
  const invitation = await db.transaction(async (tx) => {
    const [updatedInvitation] = await tx
      .update(invitations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, id))
      .returning()

    if (!updatedInvitation) {
      return undefined
    }

    if (joinerIds) {
      await syncInvitationJoiners(tx, updatedInvitation.id, joinerIds)
    }

    return updatedInvitation
  })

  if (!invitation) {
    return undefined
  }

  const [updatedInvitation] = await withJoiners([invitation])

  return updatedInvitation
}

async function deleteInvitation(id: string) {
  const [invitation] = await db
    .delete(invitations)
    .where(eq(invitations.id, id))
    .returning({ id: invitations.id })

  return invitation
}

async function withJoiners(
  rows: Invitation[]
): Promise<InvitationWithJoiners[]> {
  if (rows.length === 0) {
    return []
  }

  const invitationIds = rows.map((invitation) => invitation.id)
  const joinerRows = await db
    .select({
      email: joiners.email,
      id: joiners.id,
      invitationId: invitationJoiners.invitationId,
      name: joiners.name,
    })
    .from(invitationJoiners)
    .innerJoin(joiners, eq(invitationJoiners.joinerId, joiners.id))
    .where(inArray(invitationJoiners.invitationId, invitationIds))

  const joinersByInvitationId = new Map<string, InvitationJoiner[]>()

  for (const row of joinerRows) {
    const invitationJoiners = joinersByInvitationId.get(row.invitationId) ?? []
    invitationJoiners.push({
      email: row.email,
      id: row.id,
      name: row.name,
    })
    joinersByInvitationId.set(row.invitationId, invitationJoiners)
  }

  return rows.map((invitation) => ({
    ...invitation,
    joiners: joinersByInvitationId.get(invitation.id) ?? [],
  }))
}

async function syncInvitationJoiners(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invitationId: string,
  ids: string[]
) {
  await tx
    .delete(invitationJoiners)
    .where(eq(invitationJoiners.invitationId, invitationId))

  if (ids.length === 0) {
    return
  }

  const selectedJoiners = await tx
    .select({
      id: joiners.id,
    })
    .from(joiners)
    .where(inArray(joiners.id, ids))

  if (selectedJoiners.length !== ids.length) {
    throw new Error("Selected joiner was not found.")
  }

  await tx.insert(invitationJoiners).values(
    selectedJoiners.map((joiner) => ({
      invitationId,
      joinerId: joiner.id,
    }))
  )
}

export {
  createInvitation,
  deleteInvitation,
  listInvitations,
  updateInvitation,
}
