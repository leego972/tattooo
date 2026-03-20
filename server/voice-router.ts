import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { TRPCError } from "@trpc/server";
import type { Express, Request, Response } from "express";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createContext } from "./_core/context";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";
import { ENV } from "./_core/env";
import { consumeCredits } from "./credit-service";

// ── Temp audio store ─────────────────────────────────────────────────────────
// In-memory store for temporary audio files (id -> { filePath, mimeType, expires })
const tempAudioStore = new Map<string, { filePath: string; mimeType: string; expires: number }>();

// Clean up expired temp files every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of Array.from(tempAudioStore.entries())) {
    if (entry.expires < now) {
      fs.unlink(entry.filePath, () => {});
      tempAudioStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

/**
 * Save audio buffer to a temp file and return a local URL for transcription.
 * Files expire after 10 minutes.
 */
async function saveTempAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const id = crypto.randomBytes(16).toString("hex");
  const ext = getExtFromMime(mimeType);
  const filePath = path.join(os.tmpdir(), `tattooo-voice-${id}.${ext}`);
  await fs.promises.writeFile(filePath, buffer);
  tempAudioStore.set(id, {
    filePath,
    mimeType,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return `/api/voice/temp/${id}`;
}

/**
 * Voice transcription tRPC router
 */
export const voiceRouter = router({
  transcribe: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
        prompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let audioUrl = input.audioUrl;

      // If this is a local temp URL, read the file directly
      if (audioUrl.startsWith("/api/voice/temp/")) {
        const id = audioUrl.replace("/api/voice/temp/", "");
        const entry = tempAudioStore.get(id);
        if (!entry) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Audio file not found or expired" });
        }
        const buffer = await fs.promises.readFile(entry.filePath);
        // Clean up immediately after reading
        fs.unlink(entry.filePath, () => {});
        tempAudioStore.delete(id);

        const result = await transcribeAudioFromBuffer(
          buffer,
          entry.mimeType,
          input.language,
          input.prompt
        );
        if ("error" in result) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        // Deduct credits (non-blocking — admin bypass handled inside consumeCredits)
        try { await consumeCredits(ctx.user.id, "voice_action", "Voice transcription"); } catch {}
        return { text: result.text, language: result.language, duration: result.duration };
      }

      // External URL path
      const result = await transcribeAudio({
        audioUrl,
        language: input.language,
        prompt: input.prompt || "Transcribe the user's voice description of a tattoo design",
      });
      if ("error" in result) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error, cause: result });
      }
      try { await consumeCredits(ctx.user.id, "voice_action", "Voice transcription"); } catch {}
      return { text: result.text, language: result.language, duration: result.duration };
    }),
});

/**
 * Transcribe audio directly from a buffer (no URL needed)
 */
async function transcribeAudioFromBuffer(
  buffer: Buffer,
  mimeType: string,
  language?: string,
  prompt?: string
): Promise<{ text: string; language: string; duration: number } | { error: string }> {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    return { error: "Voice transcription not configured — set OPENAI_API_KEY" };
  }
  const ext = getExtFromMime(mimeType);
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  if (language && language !== "auto") {
    formData.append("language", language);
  }
  formData.append(
    "prompt",
    prompt || "Transcribe the user's voice description of a tattoo design"
  );
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "Accept-Encoding": "identity" },
    body: formData,
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return { error: `Transcription failed: ${response.status} ${errText}` };
  }
  const data = await response.json() as { text: string; language: string; duration: number };
  return { text: data.text, language: data.language || "en", duration: data.duration || 0 };
}

/**
 * Express route to serve temporary audio files for transcription
 * GET /api/voice/temp/:id
 */
export function registerVoiceTempRoute(app: Express) {
  app.get("/api/voice/temp/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const entry = tempAudioStore.get(id);
    if (!entry || entry.expires < Date.now()) {
      tempAudioStore.delete(id);
      return res.status(404).json({ error: "Not found or expired" });
    }
    try {
      const buffer = await fs.promises.readFile(entry.filePath);
      res.setHeader("Content-Type", entry.mimeType);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch {
      res.status(500).json({ error: "Failed to read audio file" });
    }
  });
}

/**
 * Express route for audio file upload
 * POST /api/voice/upload
 * Accepts multipart audio, saves to temp storage, returns local URL
 */
export function registerVoiceUploadRoute(app: Express) {
  app.post("/api/voice/upload", async (req: Request, res: Response) => {
    try {
      // Auth check
      const ctx = await createContext({ req, res, info: {} } as CreateExpressContextOptions);
      if (!ctx.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const MAX_SIZE = 16 * 1024 * 1024; // 16MB
      const contentType = req.headers["content-type"] || "";

      if (contentType.includes("multipart/form-data")) {
        const busboy = await import("busboy");
        const bb = busboy.default({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
        let fileBuffer: Buffer | null = null;
        let fileMime = "audio/webm";
        let fileTooBig = false;

        bb.on("file", (_field, file, info) => {
          fileMime = info.mimeType || "audio/webm";
          const chunks: Buffer[] = [];
          file.on("data", (chunk: Buffer) => chunks.push(chunk));
          file.on("limit", () => { fileTooBig = true; });
          file.on("end", () => { if (!fileTooBig) fileBuffer = Buffer.concat(chunks); });
        });

        bb.on("finish", async () => {
          if (fileTooBig) {
            return res.status(413).json({ error: "Audio file exceeds 16MB limit" });
          }
          if (!fileBuffer || fileBuffer.length < 100) {
            return res.status(400).json({ error: "No audio data received" });
          }
          try {
            const url = await saveTempAudio(fileBuffer, fileMime);
            return res.json({ url });
          } catch (err) {
            return res.status(500).json({ error: "Failed to save audio" });
          }
        });

        bb.on("error", (err: Error) => {
          if (!res.headersSent) res.status(500).json({ error: "Upload processing error" });
        });

        req.pipe(bb);
      } else {
        // Raw body upload
        const chunks: Buffer[] = [];
        let totalSize = 0;
        req.on("data", (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize <= MAX_SIZE) chunks.push(chunk);
        });
        req.on("end", async () => {
          if (totalSize > MAX_SIZE) {
            return res.status(413).json({ error: "Audio file exceeds 16MB limit" });
          }
          const buffer = Buffer.concat(chunks);
          if (buffer.length < 100) {
            return res.status(400).json({ error: "No audio data received" });
          }
          const mimeType = req.headers["content-type"] || "audio/webm";
          try {
            const url = await saveTempAudio(buffer, mimeType);
            return res.json({ url });
          } catch (err) {
            return res.status(500).json({ error: "Failed to save audio" });
          }
        });
        req.on("error", () => {
          if (!res.headersSent) res.status(500).json({ error: "Upload error" });
        });
      }
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });
}

/**
 * Express route for text-to-speech
 * POST /api/voice/tts
 * Accepts JSON { text }, returns audio/mpeg stream
 * Uses OpenAI TTS (alloy voice — warm and clear)
 */
export function registerVoiceTTSRoute(app: Express) {
  app.post("/api/voice/tts", async (req: Request, res: Response) => {
    try {
      const ctx = await createContext({ req, res, info: {} } as CreateExpressContextOptions);
      if (!ctx.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { text } = req.body || {};
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Missing 'text' field" });
      }

      const trimmedText = text.slice(0, 4096);
      const openAiKey = process.env.OPENAI_API_KEY || "";
      if (!openAiKey) {
        return res.status(503).json({ error: "TTS not configured" });
      }

      const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          input: trimmedText,
          voice: "nova",   // warm, clear female voice — suits Ink's persona
          speed: 0.95,
          response_format: "mp3",
        }),
      });

      if (!ttsRes.ok) {
        const errText = await ttsRes.text().catch(() => "");
        return res.status(502).json({ error: "TTS generation failed" });
      }

      // Buffer the full audio before sending — Safari iOS requires a complete response
      // with Content-Length set; it cannot play audio from chunked/streaming responses.
      const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", audioBuffer.length.toString());
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "no-cache");
      res.end(audioBuffer);
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return map[mime] || "webm";
}
