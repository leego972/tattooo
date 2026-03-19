/**
 * RunwayML Gen-4 image generation service.
 * Uses the /v1/text_to_image endpoint (POST) to generate high-quality tattoo artwork.
 * Docs: https://docs.dev.runwayml.com/api/
 */

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

export interface RunwayGenerationOptions {
  prompt: string;
  referenceImageUrl?: string;
  width?: number;
  height?: number;
}

export interface RunwayGenerationResult {
  imageUrl: string;
  taskId: string;
}

// ── Ratio helper ──────────────────────────────────────────────────────────────
function pickRatio(width: number, height: number): string {
  const aspect = width / height;
  if (Math.abs(aspect - 1) < 0.05) return "1024:1024";
  if (aspect > 1.7) return "1920:1080";
  if (aspect < 0.6) return "1080:1920";
  if (aspect > 1.3) return "1440:1080";
  return "1080:1440";
}

// ── Poll for task completion ───────────────────────────────────────────────────
async function pollForResult(
  taskId: string,
  apiKey: string,
  maxAttempts = 60,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_VERSION,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`RunwayML task poll failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      status: string;
      output?: string[];
      failure?: string;
      failureCode?: string;
    };

    if (data.status === "SUCCEEDED" && data.output && data.output.length > 0) {
      return data.output[0];
    }

    if (data.status === "FAILED") {
      throw new Error(
        `RunwayML generation failed: ${data.failure || data.failureCode || "Unknown error"}`
      );
    }
    // PENDING or RUNNING — keep polling
  }

  throw new Error("RunwayML generation timed out after waiting 3 minutes.");
}

// ── Main generation function ──────────────────────────────────────────────────
export async function generateTattooWithRunway(
  options: RunwayGenerationOptions
): Promise<RunwayGenerationResult> {
  const apiKey = process.env.RUNWAYML_API_KEY;
  if (!apiKey) throw new Error("RUNWAYML_API_KEY is not configured");

  const { prompt, referenceImageUrl, width = 1024, height = 1024 } = options;

  const ratio = pickRatio(width, height);

  // Build the request body — referenceImages is REQUIRED by the API (1-3 items)
  // If no user reference image, we use a minimal placeholder approach:
  // We always include at least one reference image (the prompt describes the style)
  const referenceImages: Array<{ uri: string; tag?: string }> = [];

  if (referenceImageUrl) {
    referenceImages.push({ uri: referenceImageUrl, tag: "reference" });
  } else {
    // Use a simple white canvas data URI as a neutral reference so the API
    // doesn't reject the request for missing referenceImages
    referenceImages.push({
      uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
      tag: "style",
    });
  }

  const body = {
    model: "gen4_image",
    promptText: prompt.slice(0, 1500),
    ratio,
    referenceImages,
  };

  const res = await fetch(`${RUNWAY_API_BASE}/text_to_image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RunwayML request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string };
  const taskId = data.id;

  const imageUrl = await pollForResult(taskId, apiKey);

  return { imageUrl, taskId };
}

// ── Image-to-Video (Animated Reveal) ─────────────────────────────────────────
export interface RunwayVideoOptions {
  imageUrl: string;
  prompt?: string;
  duration?: 5 | 10;
}

export interface RunwayVideoResult {
  videoUrl: string;
  taskId: string;
}

/**
 * Generate an animated reveal video from a tattoo image using RunwayML Gen-3 Alpha Turbo.
 * The animation subtly brings the tattoo to life with motion.
 */
export async function generateTattooVideo(
  options: RunwayVideoOptions
): Promise<RunwayVideoResult> {
  const apiKey = process.env.RUNWAYML_API_KEY;
  if (!apiKey) throw new Error("RUNWAYML_API_KEY is not configured");

  const { imageUrl, prompt = "Cinematic tattoo reveal, subtle ink flow, dramatic lighting", duration = 5 } = options;

  const body = {
    model: "gen3a_turbo",
    promptImage: imageUrl,
    promptText: prompt.slice(0, 512),
    duration,
    ratio: "1280:768",
    watermark: false,
  };

  const res = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RunwayML video request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string };
  const taskId = data.id;

  // Poll for video completion (videos take longer — up to 90 seconds)
  const videoUrl = await pollForResult(taskId, apiKey, 60, 5000);

  return { videoUrl, taskId };
}
