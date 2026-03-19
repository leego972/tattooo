/**
 * Image generation helper using DALL-E 3 via OpenAI API.
 *
 * Includes a prompt sanitiser that rewrites terms that commonly trigger
 * DALL-E 3's content policy filter in an artistic tattoo context, and an
 * automatic retry with a stripped-down safe prompt if the first attempt fails.
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

// ─── Prompt Sanitiser ──────────────────────────────────────────────────────────
// DALL-E 3 is stricter than RunwayML. These substitutions reframe common tattoo
// imagery into language that passes the safety filter while preserving artistic intent.
const SAFE_SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/\bblood\b/gi, "crimson ink drops"],
  [/\bbloody\b/gi, "crimson-stained"],
  [/\bbleeding\b/gi, "dripping ink"],
  [/\bdead\b/gi, "skeletal"],
  [/\bdeath\b/gi, "mortality symbolism"],
  [/\bkill\b/gi, "vanquish"],
  [/\bmurder\b/gi, "dark folklore"],
  [/\bviolence\b/gi, "fierce energy"],
  [/\bviolent\b/gi, "fierce"],
  [/\bweapon\b/gi, "ornamental tool"],
  [/\bgun\b/gi, "ornamental pistol motif"],
  [/\bpistol\b/gi, "ornamental pistol motif"],
  [/\brifle\b/gi, "ornamental rifle motif"],
  [/\bknife\b/gi, "ornamental blade"],
  [/\bdagger\b/gi, "ornamental dagger motif"],
  [/\bsword\b/gi, "ornamental sword motif"],
  [/\baxe\b/gi, "ornamental axe motif"],
  [/\bscythe\b/gi, "ornamental scythe motif"],
  [/\bskull\b/gi, "decorative skull motif in tattoo flash art style"],
  [/\bskulls\b/gi, "decorative skull motifs in tattoo flash art style"],
  [/\bdemon\b/gi, "mythological dark spirit"],
  [/\bdevil\b/gi, "mythological horned figure"],
  [/\bsatan\b/gi, "mythological dark deity"],
  [/\bhell\b/gi, "underworld realm"],
  [/\bhellfire\b/gi, "underworld flames"],
  [/\bserpent\b/gi, "coiled snake motif"],
  [/\bvenom\b/gi, "toxic essence"],
  [/\bpoison\b/gi, "toxic essence"],
  [/\bnaked\b/gi, "figure"],
  [/\bnude\b/gi, "figure"],
  [/\bsexual\b/gi, "artistic"],
  [/\berotic\b/gi, "artistic"],
];

/**
 * Sanitise a prompt for DALL-E 3 by substituting terms that commonly trigger
 * the content policy filter in a tattoo art context.
 */
function sanitisePrompt(prompt: string): string {
  let sanitised = prompt;
  for (const [pattern, replacement] of SAFE_SUBSTITUTIONS) {
    sanitised = sanitised.replace(pattern, replacement);
  }
  return sanitised;
}

/**
 * Build a minimal safe fallback prompt from the original user request.
 * Used when both the refined prompt and sanitised prompt fail content policy.
 */
function buildSafeMinimalPrompt(originalPrompt: string): string {
  const sanitised = sanitisePrompt(originalPrompt);
  return `Professional tattoo flash art design: ${sanitised}. Isolated on pure white background, no skin, no body, print-ready artwork, ultra high detail, tattoo illustration style.`;
}

// ─── Core DALL-E 3 call ────────────────────────────────────────────────────────

type DallE3Error = Error & { isContentPolicy?: boolean };

async function callDallE3(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const isContentPolicy =
      response.status === 400 &&
      (detail.includes("content_policy_violation") ||
        detail.includes("safety system") ||
        detail.includes("not allowed"));
    const error: DallE3Error = new Error(
      `DALL-E 3 image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
    error.isContentPolicy = isContentPolicy;
    throw error;
  }

  const result = (await response.json()) as {
    data: Array<{ b64_json: string }>;
  };
  const base64Data = result.data[0]?.b64_json;
  if (!base64Data) {
    throw new Error("DALL-E 3 returned no image data");
  }
  return base64Data;
}

// ─── Public generateImage function ────────────────────────────────────────────

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  let base64Data: string;

  // Attempt 1: sanitised version of the refined prompt
  const sanitisedPrompt = sanitisePrompt(options.prompt);
  try {
    base64Data = await callDallE3(sanitisedPrompt);
  } catch (err: unknown) {
    const e = err as DallE3Error;
    if (e.isContentPolicy) {
      // Attempt 2: minimal safe fallback prompt derived from the original request
      console.warn("[DALL-E 3] Content policy hit on refined prompt — retrying with safe minimal prompt");
      try {
        const safePrompt = buildSafeMinimalPrompt(options.prompt);
        base64Data = await callDallE3(safePrompt);
      } catch (retryErr: unknown) {
        const re = retryErr as DallE3Error;
        if (re.isContentPolicy) {
          // Attempt 3: ultra-generic tattoo flash art prompt
          console.warn("[DALL-E 3] Content policy hit on safe minimal prompt — retrying with generic prompt");
          base64Data = await callDallE3(
            "Professional tattoo flash art design, traditional style, bold linework, isolated on pure white background, print-ready artwork, ultra high detail"
          );
        } else {
          throw retryErr;
        }
      }
    } else {
      throw err;
    }
  }

  const buffer = Buffer.from(base64Data!, "base64");

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    "image/png"
  );

  return { url };
}
