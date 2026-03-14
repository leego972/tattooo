import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Stores all AI-generated tattoo designs with body placement and size metadata.
 */
export const tattooGenerations = mysqlTable("tattoo_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  userPrompt: text("userPrompt").notNull(),
  refinedPrompt: text("refinedPrompt"),
  imageUrl: text("imageUrl").notNull(),
  referenceImageUrl: text("referenceImageUrl"),
  style: varchar("style", { length: 64 }),
  bodyPlacement: varchar("bodyPlacement", { length: 64 }),
  sizeLabel: varchar("sizeLabel", { length: 16 }),
  sizeInCm: varchar("sizeInCm", { length: 32 }),
  nickname: varchar("nickname", { length: 128 }),
  printImageUrl: text("printImageUrl"),
  printSpec: varchar("printSpec", { length: 128 }),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TattooGeneration = typeof tattooGenerations.$inferSelect;
export type InsertTattooGeneration = typeof tattooGenerations.$inferInsert;
