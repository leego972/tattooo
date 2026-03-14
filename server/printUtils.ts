/**
 * Print-ready utilities for tatt-ooo.
 * Converts physical tattoo sizes to pixel dimensions at 300 DPI,
 * and embeds proper DPI metadata into PNG files for direct artist use.
 */

export const PRINT_DPI = 300;

/**
 * Convert centimetres to pixels at 300 DPI.
 * 1 inch = 2.54 cm, so: px = (cm / 2.54) * dpi
 */
export function cmToPx(cm: number, dpi = PRINT_DPI): number {
  return Math.round((cm / 2.54) * dpi);
}

/**
 * Parse a size string like "10" or "10x15" into width/height in cm.
 * If only one value given, it's treated as a square.
 */
export function parseSizeCm(sizeStr: string): { widthCm: number; heightCm: number } {
  const parts = sizeStr.toLowerCase().replace(/\s/g, "").split(/[x×by]/);
  const w = parseFloat(parts[0] || "10");
  const h = parts[1] ? parseFloat(parts[1]) : w;
  return {
    widthCm: isNaN(w) ? 10 : w,
    heightCm: isNaN(h) ? 10 : h,
  };
}

/**
 * Given a size label (XS/S/M/L/XL/XXL) return a default cm value.
 */
export function sizeLabelToCm(label: string): number {
  const map: Record<string, number> = {
    XS: 3,
    S: 6,
    M: 12,
    L: 20,
    XL: 30,
    XXL: 45,
  };
  return map[label.toUpperCase()] ?? 10;
}

/**
 * Determine the best pixel dimensions for image generation.
 * RunwayML/DALL-E typically support: 512, 768, 1024, 1280, 1536, 2048.
 * We pick the closest supported size >= the print requirement.
 */
export function getGenerationDimensions(widthCm: number, heightCm: number): {
  genWidth: number;
  genHeight: number;
  printWidthPx: number;
  printHeightPx: number;
} {
  const printW = cmToPx(widthCm);
  const printH = cmToPx(heightCm);

  // Supported generation sizes (square and landscape/portrait)
  const SUPPORTED = [512, 768, 1024, 1280, 1536, 2048];

  const genWidth = SUPPORTED.find((s) => s >= printW) ?? 2048;
  const genHeight = SUPPORTED.find((s) => s >= printH) ?? 2048;

  return { genWidth, genHeight, printWidthPx: printW, printHeightPx: printH };
}

/**
 * Embed 300 DPI metadata into a PNG buffer using sharp.
 * Returns a new buffer with correct pHYs chunk (pixels per metre).
 * 300 DPI = 11811 pixels per metre (300 / 0.0254).
 */
export async function embedDpiMetadata(
  inputBuffer: Buffer,
  dpi = PRINT_DPI
): Promise<Buffer> {
  try {
    // Dynamic import to avoid issues if sharp native binaries aren't available
    const sharp = (await import("sharp")).default;
    const pixelsPerMetre = Math.round(dpi / 0.0254);
    const output = await sharp(inputBuffer)
      .withMetadata({ density: dpi })
      .png({ compressionLevel: 6 })
      .toBuffer();
    return output;
  } catch (err) {
    console.warn("[printUtils] sharp not available, returning original buffer:", err);
    return inputBuffer;
  }
}

/**
 * Download an image from a URL and return it as a Buffer.
 */
export async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Build a human-readable print spec string for display.
 */
export function buildPrintSpec(
  widthCm: number,
  heightCm: number,
  printWidthPx: number,
  printHeightPx: number,
  dpi = PRINT_DPI
): string {
  const isSquare = widthCm === heightCm;
  const sizeStr = isSquare ? `${widthCm}cm` : `${widthCm}×${heightCm}cm`;
  return `${sizeStr} · ${dpi} DPI · ${printWidthPx}×${printHeightPx}px`;
}
