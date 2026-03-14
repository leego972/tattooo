import { and, desc, eq, isNull } from "drizzle-orm";
import { tattooGenerations, InsertTattooGeneration } from "../drizzle/schema";
import { getDb } from "./db";

export async function saveTattooGeneration(data: InsertTattooGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tattooGenerations).values(data);
  return result;
}

export async function getTattooGenerationsBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tattooGenerations)
    .where(
      and(
        eq(tattooGenerations.sessionId, sessionId),
        isNull(tattooGenerations.deletedAt)
      )
    )
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(50);
}

export async function getTattooGenerationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tattooGenerations)
    .where(
      and(
        eq(tattooGenerations.userId, userId),
        isNull(tattooGenerations.deletedAt)
      )
    )
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(200);
}

export async function getTattooGenerationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(tattooGenerations)
    .where(eq(tattooGenerations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function softDeleteTattooGeneration(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Only delete if it belongs to this user
  await db
    .update(tattooGenerations)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(tattooGenerations.id, id),
        eq(tattooGenerations.userId, userId)
      )
    );
}

export async function renameTattooGeneration(id: number, userId: number, nickname: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(tattooGenerations)
    .set({ nickname })
    .where(
      and(
        eq(tattooGenerations.id, id),
        eq(tattooGenerations.userId, userId)
      )
    );
}

export async function getAllPublicGenerations(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tattooGenerations)
    .where(isNull(tattooGenerations.deletedAt))
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(limit);
}
