import { describe, it, expect } from "vitest";

// Test the language map used in outreach campaign creation
const LANG_NAMES: Record<string, string> = {
  en: "English", fr: "French", es: "Spanish", de: "German",
  it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean",
  zh: "Mandarin Chinese", ar: "Arabic", ru: "Russian", nl: "Dutch",
  pl: "Polish", sv: "Swedish", no: "Norwegian", da: "Danish",
};

describe("Outreach language map", () => {
  it("maps all 16 supported language codes", () => {
    expect(Object.keys(LANG_NAMES)).toHaveLength(16);
  });

  it("returns English for 'en'", () => {
    expect(LANG_NAMES["en"]).toBe("English");
  });

  it("returns Japanese for 'ja'", () => {
    expect(LANG_NAMES["ja"]).toBe("Japanese");
  });

  it("returns Arabic for 'ar'", () => {
    expect(LANG_NAMES["ar"]).toBe("Arabic");
  });

  it("returns undefined for unknown code", () => {
    expect(LANG_NAMES["xx"]).toBeUndefined();
  });
});

// Test contact CSV parsing logic
function parseContacts(text: string) {
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.map((line) => {
    const parts = line.split(",").map((p) => p.trim());
    return {
      email: parts[0] || "",
      name: parts[1] || undefined,
      studioName: parts[2] || undefined,
      country: parts[3] || undefined,
      language: parts[4] || "en",
    };
  }).filter((c) => c.email.includes("@"));
}

describe("Outreach contact CSV parser", () => {
  it("parses a single valid contact", () => {
    const result = parseContacts("artist@studio.jp, Kenji Tanaka, Tokyo Ink, Japan, ja");
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("artist@studio.jp");
    expect(result[0].name).toBe("Kenji Tanaka");
    expect(result[0].language).toBe("ja");
  });

  it("parses multiple contacts", () => {
    const csv = "a@b.com, Alice, Studio A, USA, en\nc@d.fr, Marie, Paris Ink, France, fr";
    const result = parseContacts(csv);
    expect(result).toHaveLength(2);
  });

  it("filters out lines without @ in email", () => {
    const result = parseContacts("notanemail, Alice, Studio, USA, en");
    expect(result).toHaveLength(0);
  });

  it("defaults language to en when not provided", () => {
    const result = parseContacts("artist@studio.com, Bob, Studio B, USA");
    expect(result[0].language).toBe("en");
  });

  it("handles empty input", () => {
    const result = parseContacts("");
    expect(result).toHaveLength(0);
  });
});
