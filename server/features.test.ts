import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const cookies: Record<string, string> = {};
  const clearedCookies: string[] = [];
  const setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies,
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string) => { clearedCookies.push(name); },
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
    } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAuthCtx(userId = 1): { ctx: TrpcContext } {
  const ctx = makeCtx({
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
  return { ctx };
}

// ─── Auth Router Tests ────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const { ctx } = makeAuthCtx();
    const clearedCookies: string[] = [];
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBeGreaterThan(0);
  });

  it("returns null for auth.me when no cookie is present", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

// ─── Credits Router Tests ─────────────────────────────────────────────────────

describe("subscription.getPlans", () => {
  it("returns the membership plan object with monthly and yearly options", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();

    expect(plans).toHaveProperty("monthly");
    expect(plans).toHaveProperty("yearly");
    expect(plans).toHaveProperty("features");
  });

  it("monthly and yearly plans have name and price", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();

    expect(plans.monthly).toHaveProperty("name");
    expect(plans.monthly).toHaveProperty("price");
    expect(plans.yearly).toHaveProperty("name");
    expect(plans.yearly).toHaveProperty("price");
  });
});

// ─── Tattoo Router Tests ──────────────────────────────────────────────────────

describe("tattoo.gallery", () => {
  it("returns an array (possibly empty) of public designs", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tattoo.gallery({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("tattoo.history", () => {
  it("returns an array for a session query", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tattoo.history({ sessionId: "test-session-123" });

    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── My Tatts Router Tests ────────────────────────────────────────────────────

describe("myTatts.list", () => {
  it("throws UNAUTHORIZED when called without auth", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.myTatts.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("myTatts.delete", () => {
  it("throws UNAUTHORIZED when called without auth", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.myTatts.delete({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

// ─── Promo Code Tests ─────────────────────────────────────────────────────────

describe("promo.validate", () => {
  it("returns valid=false for unknown promo code", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.promo.validate({ code: "NOTACODE" });
    expect(result.valid).toBe(false);
  });

  it("returns a boolean valid field for any code", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.promo.validate({ code: "TATTOO50" });
    expect(typeof result.valid).toBe("boolean");
  });
});

// ─── Referral Tests ───────────────────────────────────────────────────────────

describe("referral.validate", () => {
  it("returns valid=false for unknown referral code", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.referral.validate({ code: "NOTACODE" });
    expect(result.valid).toBe(false);
  });
});

describe("referral.getMyCode", () => {
  it("throws UNAUTHORIZED when called without auth", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.referral.getMyCode()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("referral.getStats", () => {
  it("throws UNAUTHORIZED when called without auth", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.referral.getStats()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

// ─── API Keys Sanity Check ────────────────────────────────────────────────────

describe("environment", () => {
  it("has OPENAI_API_KEY set", () => {
    expect(process.env.OPENAI_API_KEY).toBeTruthy();
  });

  it("has RUNWAYML_API_KEY set", () => {
    expect(process.env.RUNWAYML_API_KEY).toBeTruthy();
  });

  it("has JWT_SECRET set", () => {
    expect(process.env.JWT_SECRET).toBeTruthy();
  });
});
