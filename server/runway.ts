/**
 * RunwayML Gen-3 Alpha image generation service.
 * Uses the text-to-image endpoint to generate high-quality tattoo artwork.
 */

const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";

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
        "X-Runway-Version": "2024-11-06",
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

export async function generateTattooWithRunway(
  options: RunwayGenerationOptions
): Promise<RunwayGenerationResult> {
  const apiKey = process.env.RUNWAYML_API_KEY;
  if (!apiKey) throw new Error("RUNWAYML_API_KEY is not configured");

  const { prompt, referenceImageUrl, width = 1024, height = 1024 } = options;

  // Build the request body for image generation
  const body: Record<string, unknown> = {
    model: "gen4_image",
    promptText: prompt,
    ratio: width === height ? "1:1" : width > height ? "16:9" : "9:16",
    outputFormat: "png",
  };

  // If a reference image is provided, include it
  if (referenceImageUrl) {
    body.referenceImages = [
      {
        uri: referenceImageUrl,
        tag: "reference",
      },
    ];
  }

  const res = await fetch(`${RUNWAY_API_BASE}/image_to_image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Fall back to built-in image generation if RunwayML fails
    throw new Error(`RunwayML request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string };
  const taskId = data.id;

  const imageUrl = await pollForResult(taskId, apiKey);

  return { imageUrl, taskId };
}
