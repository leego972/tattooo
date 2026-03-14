import { desc, eq } from "drizzle-orm";
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
    .where(eq(tattooGenerations.sessionId, sessionId))
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(50);
}

export async function getTattooGenerationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tattooGenerations)
    .where(eq(tattooGenerations.userId, userId))
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(100);
}

export async function getAllPublicGenerations(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tattooGenerations)
    .orderBy(desc(tattooGenerations.createdAt))
    .limit(limit);
}
