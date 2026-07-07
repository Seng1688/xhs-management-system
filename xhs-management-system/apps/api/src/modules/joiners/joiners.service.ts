import { asc, eq } from "drizzle-orm"

import { db } from "../../db/client.js"
import { joiners } from "../../db/schema/index.js"
import type { CreateJoinerDto, UpdateJoinerDto } from "./joiners.dto.js"

const duplicateEmailMessage = "A joiner with this email already exists."

async function listJoiners() {
  return db
    .select()
    .from(joiners)
    .orderBy(asc(joiners.name), asc(joiners.email))
}

async function createJoiner(data: CreateJoinerDto) {
  try {
    const [joiner] = await db.insert(joiners).values(data).returning()

    if (!joiner) {
      throw new Error("Failed to create joiner.")
    }

    return joiner
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new JoinerConflictError(duplicateEmailMessage)
    }

    throw error
  }
}

async function updateJoiner(id: string, data: UpdateJoinerDto) {
  try {
    const [joiner] = await db
      .update(joiners)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(joiners.id, id))
      .returning()

    return joiner
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new JoinerConflictError(duplicateEmailMessage)
    }

    throw error
  }
}

async function deleteJoiner(id: string) {
  const [joiner] = await db
    .delete(joiners)
    .where(eq(joiners.id, id))
    .returning({ id: joiners.id })

  return joiner
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
  )
}

class JoinerConflictError extends Error {}

export {
  JoinerConflictError,
  createJoiner,
  deleteJoiner,
  listJoiners,
  updateJoiner,
}
