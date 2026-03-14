import { describe, it, expect } from "vitest";

describe("API Key Configuration", () => {
  it("OPENAI_API_KEY is set and has correct format", () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key, "OPENAI_API_KEY must be set").toBeTruthy();
    expect(key!.startsWith("sk-"), "OPENAI_API_KEY must start with sk-").toBe(true);
    expect(key!.length, "OPENAI_API_KEY must be at least 40 chars").toBeGreaterThan(40);
  });

  it("RUNWAYML_API_KEY is set and has correct format", () => {
    const key = process.env.RUNWAYML_API_KEY;
    expect(key, "RUNWAYML_API_KEY must be set").toBeTruthy();
    expect(key!.startsWith("key_"), "RUNWAYML_API_KEY must start with key_").toBe(true);
    expect(key!.length, "RUNWAYML_API_KEY must be at least 20 chars").toBeGreaterThan(20);
  });
});
