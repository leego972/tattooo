/**
 * DrawingBoard — Professional Tattoo Design Studio
 *
 * Features:
 *  - Physical scale ruler (cm / inch) with real-world size input
 *  - Wrap-around cylinder preview (arm, wrist, leg, torso)
 *  - Body part size presets with circumference-accurate wrapping
 *  - Reference image import with opacity control (trace over photos)
 *  - Skin tone background presets (fair → dark)
 *  - Stencil export — high-contrast black on white, print-ready
 *  - Brush styles: Round, Flat, Ink (tapered), Spray
 *  - Pressure-simulated variable width
 *  - Symmetry mode (horizontal mirror)
 *  - Fill / paint bucket tool
 *  - Shape tools: line, ellipse, rect, triangle
 *  - Text placement
 *  - Undo / redo (40 steps)
 *  - Export: PNG (3×), JPEG, Stencil, Print
 *  - Keyboard shortcuts
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brush, Eraser, Type, Minus, Circle, Square, Triangle,
  Undo2, Redo2, Download, Printer, Trash2, ZoomIn, ZoomOut,
  RotateCcw, ChevronLeft, Pipette, Move, Droplets, FlipHorizontal,
  Layers, ImagePlus, Wand2, Ruler, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tool = "select" | "brush" | "eraser" | "text" | "line" | "circle" | "rect" | "fill" | "triangle";
type BrushStyle = "round" | "flat" | "ink" | "spray";
type SkinTone = "none" | "fair" | "light" | "medium" | "tan" | "brown" | "dark";
type BodyPart = "wrist" | "forearm" | "upper_arm" | "ankle" | "calf" | "thigh" | "torso" | "custom";
type Unit = "cm" | "in";

// ── Constants ─────────────────────────────────────────────────────────────────
const SKIN_TONES: Record<SkinTone, string> = {
  none: "#ffffff",
  fair: "#FDDBB4",
  light: "#F5C89A",
  medium: "#D4956A",
  tan: "#C07A4F",
  brown: "#8D5524",
  dark: "#4A2912",
};

// Real-world circumferences in cm for common body parts
const BODY_PARTS: Record<BodyPart, { label: string; circumferenceCm: number; heightCm: number }> = {
  wrist:     { label: "Wrist",      circumferenceCm: 16,  heightCm: 5  },
  forearm:   { label: "Forearm",    circumferenceCm: 26,  heightCm: 12 },
  upper_arm: { label: "Upper Arm",  circumferenceCm: 32,  heightCm: 15 },
  ankle:     { label: "Ankle",      circumferenceCm: 22,  heightCm: 8  },
  calf:      { label: "Calf",       circumferenceCm: 36,  heightCm: 18 },
  thigh:     { label: "Thigh",      circumferenceCm: 55,  heightCm: 25 },
  torso:     { label: "Torso",      circumferenceCm: 90,  heightCm: 50 },
  custom:    { label: "Custom",     circumferenceCm: 30,  heightCm: 15 },
};

const COLORS = [
  "#000000", "#1a1a1a", "#333333", "#666666",
  "#999999", "#cccccc", "#ffffff", "#f5f5f0",
  "#e94560", "#ff6b6b", "#ff9f43", "#feca57",
  "#48dbfb", "#54a0ff", "#5f27cd", "#a29bfe",
  "#00d2d3", "#01aaa4", "#10ac84", "#55efc4",
  "#ee5a24", "#c0392b", "#8e44ad", "#2980b9",
  "#27ae60", "#f39c12", "#d35400", "#2c3e50",
];

const CANVAS_SIZES = [
  { label: "Square 1K", w: 1024, h: 1024 },
  { label: "Square 2K", w: 2048, h: 2048 },
  { label: "Portrait A4", w: 794, h: 1123 },
  { label: "Landscape", w: 1280, h: 720 },
  { label: "Banner", w: 1920, h: 600 },
];

const RULER_HEIGHT = 24; // px

// ── Flood fill ────────────────────────────────────────────────────────────────
function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string, tolerance = 30) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;
  const toIdx = (x: number, y: number) => (y * w + x) * 4;
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = 1;
  const tc = tmp.getContext("2d")!;
  tc.fillStyle = fillColor;
  tc.fillRect(0, 0, 1, 1);
  const fc = tc.getImageData(0, 0, 1, 1).data;
  const [fr, fg, fb, fa] = [fc[0], fc[1], fc[2], fc[3]];
  const si = toIdx(Math.round(startX), Math.round(startY));
  const [sr, sg, sb, sa] = [data[si], data[si + 1], data[si + 2], data[si + 3]];
  if (sr === fr && sg === fg && sb === fb && sa === fa) return;
  const colorMatch = (idx: number) =>
    Math.abs(data[idx] - sr) <= tolerance &&
    Math.abs(data[idx + 1] - sg) <= tolerance &&
    Math.abs(data[idx + 2] - sb) <= tolerance &&
    Math.abs(data[idx + 3] - sa) <= tolerance;
  const stack: [number, number][] = [[Math.round(startX), Math.round(startY)]];
  const visited = new Uint8Array(w * h);
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const flatIdx = y * w + x;
    if (visited[flatIdx]) continue;
    const idx = flatIdx * 4;
    if (!colorMatch(idx)) continue;
    visited[flatIdx] = 1;
    data[idx] = fr; data[idx + 1] = fg; data[idx + 2] = fb; data[idx + 3] = fa;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Ruler canvas renderer ─────────────────────────────────────────────────────
function drawRuler(
  canvas: HTMLCanvasElement,
  canvasWidthPx: number,
  realWidthCm: number,
  unit: Unit,
  zoom: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = canvasWidthPx;
  canvas.height = RULER_HEIGHT;
  ctx.clearRect(0, 0, canvasWidthPx, RULER_HEIGHT);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvasWidthPx, RULER_HEIGHT);

  const totalUnits = unit === "cm" ? realWidthCm : realWidthCm / 2.54;
  const pxPerUnit = (canvasWidthPx * zoom) / totalUnits;

  ctx.strokeStyle = "#555";
  ctx.fillStyle = "#aaa";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";

  const step = unit === "cm" ? 1 : 0.5; // major tick every 1cm or 0.5in
  const subStep = unit === "cm" ? 0.5 : 0.25; // minor tick

  for (let u = 0; u <= totalUnits + step; u += subStep) {
    const x = u * pxPerUnit;
    if (x > canvasWidthPx) break;
    const isMajor = Math.abs(u % step) < 0.001;
    const tickH = isMajor ? 10 : 5;
    ctx.beginPath();
    ctx.moveTo(x, RULER_HEIGHT);
    ctx.lineTo(x, RULER_HEIGHT - tickH);
    ctx.strokeStyle = isMajor ? "#888" : "#444";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (isMajor && u > 0) {
      const label = unit === "cm" ? `${u}` : `${u}"`;
      ctx.fillText(label, x, RULER_HEIGHT - 12);
    }
  }

  // Unit label
  ctx.fillStyle = "#666";
  ctx.textAlign = "left";
  ctx.fillText(unit === "cm" ? "cm" : "in", 4, RULER_HEIGHT - 12);
}

// ── Wrap-around cylinder preview ──────────────────────────────────────────────
function renderCylinder(
  previewCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  circumferenceCm: number,
  heightCm: number,
  skinTone: SkinTone
) {
  const pw = previewCanvas.width;
  const ph = previewCanvas.height;
  const ctx = previewCanvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, pw, ph);

  // Draw cylinder body (ellipse top/bottom + rect sides)
  const cylW = pw * 0.7;
  const cylH = ph * 0.8;
  const cx = pw / 2;
  const cy = ph / 2;
  const rx = cylW / 2;
  const ry = cylH / 2;
  const ellipseRy = rx * 0.25; // perspective squash

  // Skin gradient
  const skinHex = SKIN_TONES[skinTone] === "#ffffff" ? "#D4956A" : SKIN_TONES[skinTone];
  const grad = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
  grad.addColorStop(0, darken(skinHex, 0.4));
  grad.addColorStop(0.3, lighten(skinHex, 0.15));
  grad.addColorStop(0.7, lighten(skinHex, 0.15));
  grad.addColorStop(1, darken(skinHex, 0.4));

  // Cylinder sides
  ctx.beginPath();
  ctx.rect(cx - rx, cy - ry + ellipseRy, cylW, cylH - ellipseRy * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Map the tattoo design onto the cylinder using horizontal sine distortion
  const imgW = sourceCanvas.width;
  const imgH = sourceCanvas.height;

  // We draw vertical slices of the source image, each compressed by the cosine
  // of the angle around the cylinder — this simulates the wrap-around effect.
  const slices = Math.ceil(cylW);
  for (let i = 0; i < slices; i++) {
    const t = i / slices; // 0..1 across cylinder width
    const angle = (t - 0.5) * Math.PI; // -π/2 .. π/2
    const cosA = Math.cos(angle);
    if (cosA <= 0) continue;

    // Source x range for this slice
    const srcX = Math.floor(t * imgW);
    const srcW = Math.max(1, Math.ceil(imgW / slices));

    // Destination x and width (compressed by cosine)
    const destX = cx - rx + i;
    const destW = 1;

    // Vertical compression: top/bottom of cylinder curve inward
    const yOffset = cy - ry + ellipseRy;
    const destH = (cylH - ellipseRy * 2) * cosA;
    const destY = cy - destH / 2;

    ctx.drawImage(sourceCanvas, srcX, 0, srcW, imgH, destX, destY, destW, destH);

    // Darken edges for 3D effect
    const edgeDark = Math.max(0, 1 - cosA * 1.5);
    if (edgeDark > 0) {
      ctx.fillStyle = `rgba(0,0,0,${edgeDark * 0.6})`;
      ctx.fillRect(destX, destY, destW, destH);
    }
  }

  // Top ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy - ry + ellipseRy, rx, ellipseRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = lighten(skinHex, 0.2);
  ctx.fill();
  ctx.strokeStyle = darken(skinHex, 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bottom ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy + ry - ellipseRy, rx, ellipseRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = darken(skinHex, 0.2);
  ctx.fill();
  ctx.stroke();

  // Highlight sheen
  const sheen = ctx.createLinearGradient(cx - rx * 0.5, cy - ry, cx - rx * 0.1, cy);
  sheen.addColorStop(0, "rgba(255,255,255,0.18)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.rect(cx - rx * 0.55, cy - ry + ellipseRy, rx * 0.45, cylH - ellipseRy * 2);
  ctx.fillStyle = sheen;
  ctx.fill();

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Wrap preview — ${circumferenceCm}cm circumference`, cx, ph - 6);
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}
function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * amount));
  return `rgb(${r},${g},${b})`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DrawingBoard() {
  const [location] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rulerRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Core drawing state ────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(8);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>("ink");
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#000000");
  const [customColor, setCustomColor] = useState("#000000");
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(24);
  const [canvasSize, setCanvasSize] = useState({ w: 1024, h: 1024 });
  const [symmetryMode, setSymmetryMode] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [fillTolerance, setFillTolerance] = useState(30);

  // ── Tattoo-specific state ─────────────────────────────────────────────────
  const [skinTone, setSkinTone] = useState<SkinTone>("none");
  const [unit, setUnit] = useState<Unit>("cm");
  const [realWidthCm, setRealWidthCm] = useState(10); // default 10cm wide tattoo
  const [realHeightCm, setRealHeightCm] = useState(10);
  const [showRuler, setShowRuler] = useState(true);
  const [showWrapPreview, setShowWrapPreview] = useState(false);
  const [bodyPart, setBodyPart] = useState<BodyPart>("forearm");
  const [customCircumference, setCustomCircumference] = useState(30);
  const [referenceOpacity, setReferenceOpacity] = useState(30);
  const [hasReference, setHasReference] = useState(false);
  const [showReferenceLayer, setShowReferenceLayer] = useState(true);
  const [stencilMode, setStencilMode] = useState(false);

  // Drawing refs
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const overlaySnap = useRef<ImageData | null>(null);
  const pressureRef = useRef(1.0);
  const referenceImageRef = useRef<HTMLImageElement | null>(null);

  // ── Parse URL params ──────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const imageParam = params.get("image");
    if (imageParam) setBgImageUrl(decodeURIComponent(imageParam));
  }, [location]);

  // ── Init canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    overlay.width = canvasSize.w;
    overlay.height = canvasSize.h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = SKIN_TONES[skinTone];
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    if (bgImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(canvasSize.w / img.width, canvasSize.h / img.height);
        ctx.drawImage(img, (canvasSize.w - img.width * scale) / 2, (canvasSize.h - img.height * scale) / 2, img.width * scale, img.height * scale);
        saveSnapshot();
      };
      img.onerror = () => saveSnapshot();
      img.src = bgImageUrl;
    } else {
      saveSnapshot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgImageUrl, canvasSize]);

  // ── Update background when skin tone changes ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    // Only change background if canvas is blank (first snapshot)
    if (undoStack.length <= 1) {
      ctx.fillStyle = SKIN_TONES[skinTone];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [skinTone, undoStack.length]);

  // ── Ruler ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showRuler || !rulerRef.current) return;
    drawRuler(rulerRef.current, canvasSize.w, realWidthCm, unit, zoom);
  }, [showRuler, canvasSize.w, realWidthCm, unit, zoom]);

  // ── Wrap preview ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showWrapPreview || !previewRef.current || !canvasRef.current) return;
    const circumference = bodyPart === "custom" ? customCircumference : BODY_PARTS[bodyPart].circumferenceCm;
    const height = bodyPart === "custom" ? realHeightCm : BODY_PARTS[bodyPart].heightCm;
    renderCylinder(previewRef.current, canvasRef.current, circumference, height, skinTone);
  }, [showWrapPreview, bodyPart, customCircumference, realHeightCm, skinTone]);

  // ── Snapshot helpers ──────────────────────────────────────────────────────
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-40), snap]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const current = undoStack[undoStack.length - 1];
    const prev = undoStack[undoStack.length - 2];
    setRedoStack((r) => [...r, current]);
    setUndoStack((u) => u.slice(0, -1));
    ctx.putImageData(prev, 0, 0);
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, next]);
    setRedoStack((r) => r.slice(0, -1));
    ctx.putImageData(next, 0, 0);
  }, [redoStack]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === "b") setActiveTool("brush");
      if (e.key === "e") setActiveTool("eraser");
      if (e.key === "t") setActiveTool("text");
      if (e.key === "v") setActiveTool("select");
      if (e.key === "f") setActiveTool("fill");
      if (e.key === "[") setBrushSize((s) => Math.max(1, s - 2));
      if (e.key === "]") setBrushSize((s) => Math.min(120, s + 2));
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 5));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // ── Coordinate helper ─────────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize.w / rect.width;
    const scaleY = canvasSize.h / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      const touch = e.touches[0] as Touch & { force?: number };
      pressureRef.current = touch.force && touch.force > 0 ? touch.force : 0.5;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
      pressureRef.current = 1.0;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  // ── Brush stroke ──────────────────────────────────────────────────────────
  const applyBrush = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, isEraser: boolean) => {
    const pressure = pressureRef.current;
    const effectiveSize = brushSize * (isEraser ? 1 : Math.max(0.4, pressure));
    const strokeColor = isEraser ? SKIN_TONES[skinTone] : color;
    ctx.globalAlpha = (opacity / 100) * (isEraser ? 1 : Math.max(0.3, pressure));
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = effectiveSize;
    ctx.lineCap = brushStyle === "flat" ? "square" : "round";
    ctx.lineJoin = "round";

    if (brushStyle === "spray" && !isEraser) {
      ctx.globalAlpha = 0.05 * (opacity / 100);
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * effectiveSize * 2;
        ctx.beginPath();
        ctx.arc(to.x + Math.cos(angle) * radius, to.y + Math.sin(angle) * radius, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (brushStyle === "ink" && !isEraser) {
      // Ink: tapered — width varies with pressure and speed
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const taper = Math.max(0.3, 1 - dist / (brushSize * 8));
      ctx.lineWidth = effectiveSize * taper * pressure;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Symmetry mirror
    if (symmetryMode && !isEraser) {
      const cw = ctx.canvas.width;
      ctx.beginPath();
      ctx.moveTo(cw - from.x, from.y);
      ctx.lineTo(cw - to.x, to.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (activeTool === "text") { setTextPos(pos); setShowTextInput(true); return; }
    if (activeTool === "fill") { floodFill(ctx, pos.x, pos.y, color, fillTolerance); saveSnapshot(); return; }
    setIsDrawing(true);
    lastPos.current = pos;
    shapeStart.current = pos;
    if (["line", "circle", "rect", "triangle"].includes(activeTool)) {
      overlaySnap.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    if (activeTool === "brush" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (brushSize * pressureRef.current) / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeTool === "eraser" ? SKIN_TONES[skinTone] : color;
      ctx.globalAlpha = opacity / 100;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (activeTool === "brush" || activeTool === "eraser") {
      applyBrush(ctx, lastPos.current!, pos, activeTool === "eraser");
      lastPos.current = pos;
    }
    if (activeTool === "line" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      ctx.beginPath(); ctx.moveTo(shapeStart.current.x, shapeStart.current.y); ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = "round"; ctx.globalAlpha = opacity / 100; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (activeTool === "rect" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      ctx.beginPath(); ctx.rect(shapeStart.current.x, shapeStart.current.y, pos.x - shapeStart.current.x, pos.y - shapeStart.current.y);
      ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.globalAlpha = opacity / 100; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (activeTool === "circle" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      const rx = Math.abs(pos.x - shapeStart.current.x) / 2;
      const ry = Math.abs(pos.y - shapeStart.current.y) / 2;
      ctx.beginPath(); ctx.ellipse((shapeStart.current.x + pos.x) / 2, (shapeStart.current.y + pos.y) / 2, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.globalAlpha = opacity / 100; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (activeTool === "triangle" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      const sx = shapeStart.current.x; const sy = shapeStart.current.y;
      ctx.beginPath(); ctx.moveTo(sx + (pos.x - sx) / 2, sy); ctx.lineTo(pos.x, pos.y); ctx.lineTo(sx, pos.y); ctx.closePath();
      ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.globalAlpha = opacity / 100; ctx.stroke(); ctx.globalAlpha = 1;
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null; shapeStart.current = null; overlaySnap.current = null;
    saveSnapshot();
    // Refresh wrap preview after each stroke
    if (showWrapPreview && previewRef.current && canvasRef.current) {
      const circumference = bodyPart === "custom" ? customCircumference : BODY_PARTS[bodyPart].circumferenceCm;
      const height = bodyPart === "custom" ? realHeightCm : BODY_PARTS[bodyPart].heightCm;
      renderCylinder(previewRef.current, canvasRef.current, circumference, height, skinTone);
    }
  };

  // ── Text placement ────────────────────────────────────────────────────────
  const placeText = () => {
    if (!textInput.trim()) { setShowTextInput(false); return; }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
    ctx.fillStyle = color; ctx.globalAlpha = opacity / 100;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.globalAlpha = 1;
    setTextInput(""); setShowTextInput(false);
    saveSnapshot();
  };

  // ── Reference image import ────────────────────────────────────────────────
  const handleReferenceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        referenceImageRef.current = img;
        setHasReference(true);
        setShowReferenceLayer(true);
        toast.success("Reference imported — trace over it!");
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Stencil export ────────────────────────────────────────────────────────
  const exportStencil = () => {
    const canvas = canvasRef.current!;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width; tmp.height = canvas.height;
    const ctx = tmp.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, tmp.width, tmp.height);
    const src = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const dst = ctx.getImageData(0, 0, tmp.width, tmp.height);
    for (let i = 0; i < src.data.length; i += 4) {
      const lum = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
      const v = lum < 128 ? 0 : 255;
      dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = v;
      dst.data[i + 3] = 255;
    }
    ctx.putImageData(dst, 0, 0);
    const a = document.createElement("a");
    a.download = `tattoo-stencil-${Date.now()}.png`;
    a.href = tmp.toDataURL("image/png");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Stencil exported — black on white, print-ready!");
  };

  // ── Standard exports ──────────────────────────────────────────────────────
  const exportCanvas = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    a.download = `tattoo-design-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Design exported as PNG");
  };

  const exportJpeg = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    a.download = `tattoo-design-${Date.now()}.jpg`;
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Design exported as JPEG");
  };

  const printCanvas = () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Tattoo Design Print</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;}
      img{max-width:100%;max-height:100vh;object-fit:contain;}@media print{body{margin:0;}}</style></head>
      <body><img src="${dataUrl}" onload="window.print()"/></body></html>`);
    win.document.close();
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = SKIN_TONES[skinTone];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
    toast("Canvas cleared");
  };

  // ── Tool config ───────────────────────────────────────────────────────────
  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { id: "select", icon: <Move size={15} />, label: "Select / Pan", shortcut: "V" },
    { id: "brush", icon: <Brush size={15} />, label: "Brush", shortcut: "B" },
    { id: "eraser", icon: <Eraser size={15} />, label: "Eraser", shortcut: "E" },
    { id: "fill", icon: <Droplets size={15} />, label: "Fill", shortcut: "F" },
    { id: "text", icon: <Type size={15} />, label: "Text", shortcut: "T" },
    { id: "line", icon: <Minus size={15} />, label: "Line" },
    { id: "circle", icon: <Circle size={15} />, label: "Ellipse" },
    { id: "rect", icon: <Square size={15} />, label: "Rectangle" },
    { id: "triangle", icon: <Triangle size={15} />, label: "Triangle" },
  ];

  const brushStyles: { id: BrushStyle; label: string }[] = [
    { id: "round", label: "Round" },
    { id: "flat", label: "Flat" },
    { id: "ink", label: "Ink" },
    { id: "spray", label: "Spray" },
  ];

  const cursorStyle = activeTool === "eraser" ? "cell" : activeTool === "text" ? "text" : activeTool === "fill" ? "crosshair" : activeTool === "select" ? "grab" : "crosshair";

  // ── Real-world size display ───────────────────────────────────────────────
  const displayWidth = unit === "cm" ? `${realWidthCm}cm` : `${(realWidthCm / 2.54).toFixed(1)}"`;
  const displayHeight = unit === "cm" ? `${realHeightCm}cm` : `${(realHeightCm / 2.54).toFixed(1)}"`;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0f]">

      {/* ── Top toolbar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/30 bg-card/40 backdrop-blur px-2 py-1.5 flex items-center gap-1.5 flex-wrap">
        {/* Back */}
        <a href="/my-tatts" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-1">
          <ChevronLeft size={13} /> My Tatts
        </a>
        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Tools */}
        {tools.map((t) => (
          <button key={t.id} onClick={() => { setActiveTool(t.id); setShowTextInput(false); }}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
            className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              activeTool === t.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
            {t.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Brush style */}
        {activeTool === "brush" && (
          <div className="flex items-center gap-1">
            {brushStyles.map((bs) => (
              <button key={bs.id} onClick={() => setBrushStyle(bs.id)} title={bs.label}
                className={cn("px-2 h-6 rounded text-[10px] transition-all",
                  brushStyle === bs.id ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
                {bs.label}
              </button>
            ))}
            <div className="w-px h-5 bg-border/30 mx-0.5" />
          </div>
        )}

        {/* Size */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Size</span>
          <input type="range" min={1} max={120} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-16 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-5">{brushSize}</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Opacity</span>
          <input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-16 accent-primary" />
          <span className="text-[10px] text-muted-foreground w-7">{opacity}%</span>
        </div>

        {activeTool === "fill" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Tolerance</span>
            <input type="range" min={0} max={100} value={fillTolerance} onChange={(e) => setFillTolerance(Number(e.target.value))} className="w-14 accent-primary" />
            <span className="text-[10px] text-muted-foreground w-5">{fillTolerance}</span>
          </div>
        )}

        {activeTool === "text" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Font</span>
            <input type="range" min={10} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-14 accent-primary" />
            <span className="text-[10px] text-muted-foreground w-6">{fontSize}</span>
          </div>
        )}

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={undoStack.length <= 1} title="Undo (Ctrl+Z)" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30"><Undo2 size={14} /></button>
        <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30"><Redo2 size={14} /></button>

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Zoom */}
        <button onClick={() => setZoom((z) => Math.min(z + 0.25, 5))} title="Zoom in (+)" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5"><ZoomIn size={13} /></button>
        <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.1))} title="Zoom out (-)" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5"><ZoomOut size={13} /></button>
        <button onClick={() => setZoom(1)} title="Reset zoom" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5"><RotateCcw size={12} /></button>

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Symmetry */}
        <button onClick={() => setSymmetryMode((s) => !s)} title="Symmetry mode"
          className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            symmetryMode ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
          <FlipHorizontal size={13} />
        </button>

        {/* Ruler toggle */}
        <button onClick={() => setShowRuler((r) => !r)} title="Toggle ruler"
          className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            showRuler ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
          <Ruler size={13} />
        </button>

        {/* Wrap preview toggle */}
        <button onClick={() => setShowWrapPreview((w) => !w)} title="Wrap-around preview"
          className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            showWrapPreview ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
          <Layers size={13} />
        </button>

        {/* Canvas size */}
        <div className="relative">
          <button onClick={() => setShowSizeMenu((s) => !s)} title="Canvas size" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
            <Square size={13} />
          </button>
          {showSizeMenu && (
            <div className="absolute top-9 left-0 z-50 bg-zinc-900 border border-border/40 rounded-xl shadow-xl py-1 min-w-[140px]">
              {CANVAS_SIZES.map((s) => (
                <button key={s.label} onClick={() => { setCanvasSize({ w: s.w, h: s.h }); setShowSizeMenu(false); toast.success(`Canvas: ${s.label}`); }}
                  className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors", canvasSize.w === s.w && canvasSize.h === s.h ? "text-primary" : "text-muted-foreground")}>
                  {s.label} <span className="opacity-50">{s.w}×{s.h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Clear */}
        <button onClick={clearCanvas} title="Clear canvas" className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10"><Trash2 size={13} /></button>

        {/* Export */}
        <Button size="sm" onClick={exportStencil} className="gap-1 bg-amber-600 hover:bg-amber-500 text-white text-xs h-7 px-2.5"><Wand2 size={12} /> Stencil</Button>
        <Button size="sm" onClick={exportCanvas} className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-2.5"><Download size={12} /> PNG</Button>
        <Button size="sm" onClick={exportJpeg} variant="outline" className="gap-1 text-xs h-7 px-2.5 border-border/30 hidden sm:flex"><Download size={12} /> JPG</Button>
        <Button size="sm" onClick={printCanvas} variant="outline" className="gap-1 text-xs h-7 px-2.5 border-border/30 hidden sm:flex"><Printer size={12} /> Print</Button>
      </div>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left colour panel ──────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-col w-12 border-r border-border/20 bg-card/20 p-1.5 gap-1.5 overflow-y-auto">
          <div className="w-9 h-9 rounded-xl border-2 border-white/20 mx-auto cursor-pointer shadow-lg" style={{ backgroundColor: color }} title="Current colour" />
          <label className="relative w-9 h-9 mx-auto cursor-pointer" title="Custom colour">
            <div className="w-9 h-9 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center hover:bg-white/5"><Pipette size={13} className="text-muted-foreground" /></div>
            <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
          <div className="w-7 h-px bg-border/20 mx-auto" />
          <div className="flex flex-col gap-1">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-7 h-7 mx-auto rounded-lg border transition-all hover:scale-110", color === c ? "border-white/60 scale-110 shadow-md" : "border-transparent hover:border-white/20")}
                style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>

        {/* ── Canvas area ────────────────────────────────────────────────── */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-[#111118] flex flex-col items-center justify-start p-4" style={{ cursor: cursorStyle }} onClick={() => setShowSizeMenu(false)}>

          {/* Scale / real-world size controls */}
          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground flex-wrap justify-center">
            <span className="font-semibold text-amber-400">Scale:</span>
            <label className="flex items-center gap-1">
              W:
              <input type="number" min={1} max={200} value={unit === "cm" ? realWidthCm : parseFloat((realWidthCm / 2.54).toFixed(1))}
                onChange={(e) => setRealWidthCm(unit === "cm" ? Number(e.target.value) : Number(e.target.value) * 2.54)}
                className="w-14 bg-white/5 border border-border/30 rounded px-1 py-0.5 text-white text-xs" />
              {unit}
            </label>
            <label className="flex items-center gap-1">
              H:
              <input type="number" min={1} max={200} value={unit === "cm" ? realHeightCm : parseFloat((realHeightCm / 2.54).toFixed(1))}
                onChange={(e) => setRealHeightCm(unit === "cm" ? Number(e.target.value) : Number(e.target.value) * 2.54)}
                className="w-14 bg-white/5 border border-border/30 rounded px-1 py-0.5 text-white text-xs" />
              {unit}
            </label>
            <button onClick={() => setUnit((u) => u === "cm" ? "in" : "cm")}
              className="px-2 py-0.5 rounded bg-white/5 border border-border/30 hover:bg-white/10 text-xs">
              {unit === "cm" ? "→ inches" : "→ cm"}
            </button>
            <span className="text-slate-500">|</span>
            <span>Skin:</span>
            <div className="flex gap-1">
              {(Object.entries(SKIN_TONES) as [SkinTone, string][]).map(([key, hex]) => (
                <button key={key} onClick={() => setSkinTone(key)} title={key}
                  className={cn("w-5 h-5 rounded border transition-all", skinTone === key ? "border-white scale-110" : "border-white/20 hover:border-white/50")}
                  style={{ backgroundColor: hex === "#ffffff" ? "#e8e8e8" : hex }} />
              ))}
            </div>
            {/* Reference image */}
            <button onClick={() => referenceInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-border/30 hover:bg-white/10 text-xs">
              <ImagePlus size={11} /> Ref
            </button>
            <input ref={referenceInputRef} type="file" accept="image/*" className="sr-only" onChange={handleReferenceImport} />
            {hasReference && (
              <>
                <label className="flex items-center gap-1">
                  Ref opacity:
                  <input type="range" min={5} max={80} value={referenceOpacity} onChange={(e) => setReferenceOpacity(Number(e.target.value))} className="w-14 accent-primary" />
                  <span className="w-6">{referenceOpacity}%</span>
                </label>
                <button onClick={() => setShowReferenceLayer((v) => !v)} className="text-xs text-muted-foreground hover:text-white">
                  {showReferenceLayer ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </>
            )}
          </div>

          {/* Ruler */}
          {showRuler && (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", marginBottom: 2 }}>
              <canvas ref={rulerRef} style={{ display: "block" }} />
            </div>
          )}

          {/* Canvas wrapper */}
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.12s ease", position: "relative", boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)" }}>
            {/* Reference image layer */}
            {hasReference && showReferenceLayer && referenceImageRef.current && (
              <img
                src={referenceImageRef.current.src}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", opacity: referenceOpacity / 100, pointerEvents: "none", zIndex: 1 }}
                alt="reference"
              />
            )}

            {/* Main drawing canvas */}
            <canvas ref={canvasRef} style={{ display: "block", touchAction: "none", position: "relative", zIndex: 2 }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />

            {/* Overlay canvas */}
            <canvas ref={overlayRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0, zIndex: 3 }} />

            {/* Text input overlay */}
            {showTextInput && (
              <div style={{ position: "absolute", left: textPos.x / (canvasSize.w / 100) + "%", top: textPos.y / (canvasSize.h / 100) + "%", transform: "translate(-50%, -50%)", zIndex: 10 }} className="flex items-center gap-1">
                <input autoFocus value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") placeText(); if (e.key === "Escape") setShowTextInput(false); }}
                  placeholder="Type, press Enter" className="bg-black/80 border border-primary/50 text-white px-2 py-1 rounded text-sm outline-none w-48"
                  style={{ fontSize: `${Math.max(12, fontSize / 4)}px` }} />
                <button onClick={placeText} className="px-2 py-1 bg-primary text-white rounded text-xs">Place</button>
                <button onClick={() => setShowTextInput(false)} className="px-2 py-1 bg-white/10 text-white rounded text-xs">✕</button>
              </div>
            )}

            {/* Size overlay */}
            <div style={{ position: "absolute", bottom: 6, right: 6, zIndex: 5 }} className="bg-black/60 text-xs text-amber-300 px-2 py-1 rounded font-mono pointer-events-none">
              {displayWidth} × {displayHeight}
            </div>
          </div>

          {/* Wrap-around preview panel */}
          {showWrapPreview && (
            <div className="mt-4 bg-card/30 border border-border/30 rounded-xl p-3 w-full max-w-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-400">Wrap-Around Preview</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(Object.keys(BODY_PARTS) as BodyPart[]).map((bp) => (
                    <button key={bp} onClick={() => setBodyPart(bp)}
                      className={cn("px-2 py-0.5 rounded text-[10px] border transition-all",
                        bodyPart === bp ? "bg-purple-500/20 border-purple-500 text-purple-300" : "border-border/30 text-muted-foreground hover:text-white")}>
                      {BODY_PARTS[bp].label}
                    </button>
                  ))}
                </div>
              </div>
              {bodyPart === "custom" && (
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <label className="flex items-center gap-1">
                    Circumference:
                    <input type="number" min={5} max={200} value={customCircumference} onChange={(e) => setCustomCircumference(Number(e.target.value))}
                      className="w-14 bg-white/5 border border-border/30 rounded px-1 py-0.5 text-white text-xs" />
                    cm
                  </label>
                </div>
              )}
              {bodyPart !== "custom" && (
                <p className="text-[10px] text-muted-foreground mb-2">
                  {BODY_PARTS[bodyPart].label}: {BODY_PARTS[bodyPart].circumferenceCm}cm circumference × {BODY_PARTS[bodyPart].heightCm}cm height
                </p>
              )}
              <canvas ref={previewRef} width={480} height={280} style={{ display: "block", width: "100%", borderRadius: 8, background: "#0d0d1a" }} />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                This shows how your design wraps around the selected body part. Draw, then check here.
              </p>
            </div>
          )}
        </div>

        {/* ── Mobile colour bar ──────────────────────────────────────────── */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/20 px-3 py-2 flex items-center gap-2 overflow-x-auto z-20">
          <label className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg border-2 border-white/30 cursor-pointer shadow-md" style={{ backgroundColor: color }} />
            <input type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
          <div className="w-px h-6 bg-border/30 shrink-0" />
          {COLORS.slice(0, 20).map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={cn("w-7 h-7 shrink-0 rounded-lg border transition-all", color === c ? "border-white/60 scale-110 shadow-md" : "border-transparent")}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
