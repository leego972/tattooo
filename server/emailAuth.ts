/**
 * Self-contained email + password authentication.
 * Replaces Manus OAuth for Railway deployment.
 * Uses bcryptjs for password hashing and jose for JWT session cookies.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import type { User } from "../drizzle/schema";

const SALT_ROUNDS = 12;
const SESSION_DURATION = "30d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT session helpers ───────────────────────────────────────────────────────

export async function createSessionToken(userId: number): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<number | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.sub);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

// ── User DB helpers ───────────────────────────────────────────────────────────

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

/**
 * Register a new user with email + password.
 * Returns the created user or throws if email already exists.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserByEmail(email);
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await hashPassword(password);
  const openId = `email:${email.toLowerCase()}`;

  await db.insert(users).values({
    openId,
    name,
    email: email.toLowerCase(),
    loginMethod: "email",
    passwordHash,
    emailVerified: true, // skip email verification for now
    lastSignedIn: new Date(),
  });

  const created = await getUserByEmail(email);
  if (!created) throw new Error("Failed to create user");
  return created;
}

/**
 * Authenticate a user with email + password.
 * Returns the user or throws a typed error.
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("INVALID_CREDENTIALS");
  if (!user.passwordHash) throw new Error("INVALID_CREDENTIALS");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  // Update lastSignedIn
  const db = await getDb();
  if (db) {
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));
  }

  return user;
}
