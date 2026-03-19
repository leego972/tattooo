/**
 * Hugging Face Inference API — FLUX.1-schnell image generator.
 *
 * Used as a middle fallback between RunwayML (primary) and DALL-E 3 (final fallback).
 * FLUX.1-schnell is highly permissive for tattoo imagery including dark/gothic subjects.
 *
 * Requires HF_TOKEN environment variable (free Hugging Face account token).
 */
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

export type HFGenerateOptions = {
  prompt: string;
  width?: number;
  height?: number;
};

export type HFGenerateResult = {
  imageUrl: string;
};

// FLUX.1-schnell via HF Inference API — fast, high quality, permissive
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

/**
 * Generate a tattoo design image using Hugging Face FLUX.1-schnell.
 * Returns a public S3 URL for the generated image.
 */
export async function generateWithHuggingFace(
  options: HFGenerateOptions
): Promise<HFGenerateResult> {
  if (!ENV.hfToken) {
    throw new Error("HF_TOKEN is not configured");
  }

  const { prompt, width = 1024, height = 1024 } = options;

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.hfToken}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true",
    },
    body: JSON.stringify({
      inputs: prompt.slice(0, 2000),
      parameters: {
        width,
        height,
        num_inference_steps: 4,   // schnell is optimised for 1–4 steps
        guidance_scale: 0,        // schnell uses guidance_scale=0
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Hugging Face FLUX generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  // HF Inference API returns raw image bytes (not JSON)
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length < 1000) {
    // Likely an error JSON response disguised as binary
    throw new Error(`Hugging Face returned unexpectedly small response (${buffer.length} bytes)`);
  }

  const { url } = await storagePut(
    `generated/hf-${Date.now()}.png`,
    buffer,
    "image/png"
  );

  return { imageUrl: url };
}
