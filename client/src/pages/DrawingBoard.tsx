import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brush,
  Eraser,
  Type,
  Minus,
  Circle,
  Square,
  Undo2,
  Redo2,
  Download,
  Printer,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  Pipette,
  Move,
  Droplets,
  FlipHorizontal,
  Layers,
  Triangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tool types ────────────────────────────────────────────────────────────────
type Tool = "select" | "brush" | "eraser" | "text" | "line" | "circle" | "rect" | "fill" | "triangle";
type BrushStyle = "round" | "flat" | "ink" | "spray";

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

// ── Flood fill (paint bucket) ─────────────────────────────────────────────────
function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  tolerance = 30
) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  const toIdx = (x: number, y: number) => (y * w + x) * 4;

  // Parse fill color
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = 1;
  const tc = tmp.getContext("2d")!;
  tc.fillStyle = fillColor;
  tc.fillRect(0, 0, 1, 1);
  const fc = tc.getImageData(0, 0, 1, 1).data;
  const [fr, fg, fb, fa] = [fc[0], fc[1], fc[2], fc[3]];

  const si = toIdx(Math.round(startX), Math.round(startY));
  const [sr, sg, sb, sa] = [data[si], data[si + 1], data[si + 2], data[si + 3]];

  // If target color == fill color, do nothing
  if (sr === fr && sg === fg && sb === fb && sa === fa) return;

  const colorMatch = (idx: number) => {
    return (
      Math.abs(data[idx] - sr) <= tolerance &&
      Math.abs(data[idx + 1] - sg) <= tolerance &&
      Math.abs(data[idx + 2] - sb) <= tolerance &&
      Math.abs(data[idx + 3] - sa) <= tolerance
    );
  };

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
    data[idx] = fr;
    data[idx + 1] = fg;
    data[idx + 2] = fb;
    data[idx + 3] = fa;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

export default function DrawingBoard() {
  const [location] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(8);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>("round");
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#ff6b6b");
  const [customColor, setCustomColor] = useState("#ff6b6b");
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

  // Drawing state refs (avoid stale closures)
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const overlaySnap = useRef<ImageData | null>(null);
  const pressureRef = useRef(1.0);

  // ── Parse URL params ───────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const imageParam = params.get("image");
    if (imageParam) {
      setBgImageUrl(decodeURIComponent(imageParam));
    }
  }, [location]);

  // ── Init canvas ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    overlay.width = canvasSize.w;
    overlay.height = canvasSize.h;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    if (bgImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(canvasSize.w / img.width, canvasSize.h / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvasSize.w - w) / 2;
        const y = (canvasSize.h - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        saveSnapshot();
      };
      img.onerror = () => saveSnapshot();
      img.src = bgImageUrl;
    } else {
      saveSnapshot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgImageUrl, canvasSize]);

  // ── Snapshot helpers ───────────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

  // ── Coordinate helper ──────────────────────────────────────────────────────
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
      // Simulate pressure from touch force if available
      const touch = e.touches[0] as Touch & { force?: number };
      pressureRef.current = touch.force && touch.force > 0 ? touch.force : 0.5;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
      pressureRef.current = 1.0;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // ── Apply brush stroke ─────────────────────────────────────────────────────
  const applyBrush = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    isEraser: boolean
  ) => {
    const pressure = pressureRef.current;
    const effectiveSize = brushSize * (isEraser ? 1 : Math.max(0.4, pressure));
    const strokeColor = isEraser ? "#ffffff" : color;

    ctx.globalAlpha = (opacity / 100) * (isEraser ? 1 : Math.max(0.3, pressure));
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = effectiveSize;
    ctx.lineCap = brushStyle === "flat" ? "square" : "round";
    ctx.lineJoin = "round";

    if (brushStyle === "spray" && !isEraser) {
      // Spray paint effect
      ctx.globalAlpha = 0.05 * (opacity / 100);
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * effectiveSize * 2;
        ctx.beginPath();
        ctx.arc(to.x + Math.cos(angle) * radius, to.y + Math.sin(angle) * radius, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (brushStyle === "ink" && !isEraser) {
      // Ink brush — tapered stroke
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.lineWidth = effectiveSize * pressure;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Symmetry mode — mirror horizontally
    if (symmetryMode && !isEraser) {
      const canvas = ctx.canvas;
      const mirrorX = canvas.width - to.x;
      const mirrorFromX = canvas.width - from.x;
      ctx.beginPath();
      ctx.moveTo(mirrorFromX, from.y);
      ctx.lineTo(mirrorX, to.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  // ── Drawing handlers ───────────────────────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (activeTool === "text") {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    if (activeTool === "fill") {
      floodFill(ctx, pos.x, pos.y, color, fillTolerance);
      saveSnapshot();
      return;
    }

    setIsDrawing(true);
    lastPos.current = pos;
    shapeStart.current = pos;

    if (["line", "circle", "rect", "triangle"].includes(activeTool)) {
      overlaySnap.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (activeTool === "brush" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (brushSize * pressureRef.current) / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeTool === "eraser" ? "#ffffff" : color;
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
      ctx.beginPath();
      ctx.moveTo(shapeStart.current.x, shapeStart.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.globalAlpha = opacity / 100;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (activeTool === "rect" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      const w = pos.x - shapeStart.current.x;
      const h = pos.y - shapeStart.current.y;
      ctx.beginPath();
      ctx.rect(shapeStart.current.x, shapeStart.current.y, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (activeTool === "circle" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      const rx = Math.abs(pos.x - shapeStart.current.x) / 2;
      const ry = Math.abs(pos.y - shapeStart.current.y) / 2;
      const cx = (shapeStart.current.x + pos.x) / 2;
      const cy = (shapeStart.current.y + pos.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (activeTool === "triangle" && shapeStart.current && overlaySnap.current) {
      ctx.putImageData(overlaySnap.current, 0, 0);
      const sx = shapeStart.current.x;
      const sy = shapeStart.current.y;
      ctx.beginPath();
      ctx.moveTo(sx + (pos.x - sx) / 2, sy);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineTo(sx, pos.y);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    shapeStart.current = null;
    overlaySnap.current = null;
    saveSnapshot();
  };

  // ── Text placement ─────────────────────────────────────────────────────────
  const placeText = () => {
    if (!textInput.trim()) { setShowTextInput(false); return; }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity / 100;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.globalAlpha = 1;
    setTextInput("");
    setShowTextInput(false);
    saveSnapshot();
  };

  // ── Clear canvas ───────────────────────────────────────────────────────────
  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
    toast.success("Canvas cleared");
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportCanvas = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    a.download = `tatt-ooo-custom-${Date.now()}.png`;
    a.href = canvas.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Design exported as PNG!");
  };

  const exportJpeg = () => {
    const canvas = canvasRef.current!;
    const a = document.createElement("a");
    a.download = `tatt-ooo-custom-${Date.now()}.jpg`;
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Design exported as JPEG!");
  };

  const printCanvas = () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>tatt-ooo Drawing Board Export</title>
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#fff; }
        img { max-width:100%; max-height:100vh; object-fit:contain; }
        @media print { body { margin:0; } }
      </style></head>
      <body><img src="${dataUrl}" onload="window.print()"/></body></html>
    `);
    win.document.close();
  };

  // ── Tool config ────────────────────────────────────────────────────────────
  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { id: "select", icon: <Move size={15} />, label: "Select / Pan", shortcut: "V" },
    { id: "brush", icon: <Brush size={15} />, label: "Brush", shortcut: "B" },
    { id: "eraser", icon: <Eraser size={15} />, label: "Eraser", shortcut: "E" },
    { id: "fill", icon: <Droplets size={15} />, label: "Fill (Paint Bucket)", shortcut: "F" },
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

  const cursorStyle =
    activeTool === "eraser" ? "cell" :
    activeTool === "text" ? "text" :
    activeTool === "fill" ? "crosshair" :
    activeTool === "select" ? "grab" :
    "crosshair";

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0f]">
      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/30 bg-card/40 backdrop-blur px-2 py-1.5 flex items-center gap-1.5 flex-wrap">
        {/* Back */}
        <a href="/my-tatts" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-1">
          <ChevronLeft size={13} /> My Tatts
        </a>

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Tools */}
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTool(t.id); setShowTextInput(false); }}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              activeTool === t.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Brush style (only for brush tool) */}
        {(activeTool === "brush") && (
          <div className="flex items-center gap-1">
            {brushStyles.map((bs) => (
              <button
                key={bs.id}
                onClick={() => setBrushStyle(bs.id)}
                title={bs.label}
                className={cn(
                  "px-2 h-6 rounded text-[10px] transition-all",
                  brushStyle === bs.id
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {bs.label}
              </button>
            ))}
            <div className="w-px h-5 bg-border/30 mx-0.5" />
          </div>
        )}

        {/* Brush size */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Size</span>
          <input
            type="range" min={1} max={120} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-5">{brushSize}</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Opacity</span>
          <input
            type="range" min={5} max={100} value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-16 accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-7">{opacity}%</span>
        </div>

        {/* Fill tolerance (fill tool) */}
        {activeTool === "fill" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Tolerance</span>
            <input
              type="range" min={0} max={100} value={fillTolerance}
              onChange={(e) => setFillTolerance(Number(e.target.value))}
              className="w-14 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground w-5">{fillTolerance}</span>
          </div>
        )}

        {/* Font size (text tool) */}
        {activeTool === "text" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Font</span>
            <input
              type="range" min={10} max={200} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-14 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground w-6">{fontSize}</span>
          </div>
        )}

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Undo / Redo */}
        <button onClick={undo} disabled={undoStack.length <= 1} title="Undo (Ctrl+Z)"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30">
          <Undo2 size={14} />
        </button>
        <button onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30">
          <Redo2 size={14} />
        </button>

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Zoom */}
        <button onClick={() => setZoom((z) => Math.min(z + 0.25, 5))} title="Zoom in (+)"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ZoomIn size={13} />
        </button>
        <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.1))} title="Zoom out (-)"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ZoomOut size={13} />
        </button>
        <button onClick={() => setZoom(1)} title="Reset zoom"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <RotateCcw size={12} />
        </button>

        <div className="w-px h-5 bg-border/30 mx-0.5" />

        {/* Symmetry toggle */}
        <button
          onClick={() => setSymmetryMode((s) => !s)}
          title="Symmetry mode (mirror left/right)"
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            symmetryMode
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <FlipHorizontal size={13} />
        </button>

        {/* Canvas size menu */}
        <div className="relative">
          <button
            onClick={() => setShowSizeMenu((s) => !s)}
            title="Canvas size"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <Layers size={13} />
          </button>
          {showSizeMenu && (
            <div className="absolute top-9 left-0 z-50 bg-zinc-900 border border-border/40 rounded-xl shadow-xl py-1 min-w-[140px]">
              {CANVAS_SIZES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setCanvasSize({ w: s.w, h: s.h });
                    setShowSizeMenu(false);
                    toast.success(`Canvas: ${s.label} (${s.w}×${s.h})`);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors",
                    canvasSize.w === s.w && canvasSize.h === s.h
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {s.label} <span className="opacity-50">{s.w}×{s.h}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Clear */}
        <button onClick={clearCanvas} title="Clear canvas"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
          <Trash2 size={13} />
        </button>

        {/* Export buttons */}
        <Button size="sm" onClick={exportCanvas} className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 px-2.5">
          <Download size={12} /> PNG
        </Button>
        <Button size="sm" onClick={exportJpeg} variant="outline" className="gap-1 text-xs h-7 px-2.5 border-border/30 hidden sm:flex">
          <Download size={12} /> JPG
        </Button>
        <Button size="sm" onClick={printCanvas} variant="outline" className="gap-1 text-xs h-7 px-2.5 border-border/30 hidden sm:flex">
          <Printer size={12} /> Print
        </Button>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left colour panel ─────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-col w-12 border-r border-border/20 bg-card/20 p-1.5 gap-1.5 overflow-y-auto">
          {/* Current colour swatch */}
          <div
            className="w-9 h-9 rounded-xl border-2 border-white/20 mx-auto cursor-pointer shadow-lg"
            style={{ backgroundColor: color }}
            title="Current colour"
          />

          {/* Custom colour picker */}
          <label className="relative w-9 h-9 mx-auto cursor-pointer" title="Custom colour (eyedropper)">
            <div className="w-9 h-9 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center hover:bg-white/5">
              <Pipette size={13} className="text-muted-foreground" />
            </div>
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          <div className="w-7 h-px bg-border/20 mx-auto" />

          {/* Colour palette */}
          <div className="flex flex-col gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-7 h-7 mx-auto rounded-lg border transition-all hover:scale-110",
                  color === c ? "border-white/60 scale-110 shadow-md" : "border-transparent hover:border-white/20"
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* ── Canvas area ───────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#111118] flex items-center justify-center p-4"
          style={{ cursor: cursorStyle }}
          onClick={() => setShowSizeMenu(false)}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.12s ease",
              position: "relative",
              boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Main drawing canvas */}
            <canvas
              ref={canvasRef}
              style={{ display: "block", touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {/* Overlay canvas (for shape previews) */}
            <canvas
              ref={overlayRef}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: 0 }}
            />

            {/* Text input overlay */}
            {showTextInput && (
              <div
                style={{
                  position: "absolute",
                  left: textPos.x / (canvasSize.w / 100) + "%",
                  top: textPos.y / (canvasSize.h / 100) + "%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
                className="flex items-center gap-1"
              >
                <input
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") placeText(); if (e.key === "Escape") setShowTextInput(false); }}
                  placeholder="Type text, press Enter"
                  className="bg-black/80 border border-primary/50 text-white px-2 py-1 rounded text-sm outline-none w-48"
                  style={{ fontSize: `${Math.max(12, fontSize / 4)}px` }}
                />
                <button onClick={placeText} className="px-2 py-1 bg-primary text-white rounded text-xs">Place</button>
                <button onClick={() => setShowTextInput(false)} className="px-2 py-1 bg-white/10 text-white rounded text-xs">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile colour bar (bottom) ─────────────────────────────────── */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/20 px-3 py-2 flex items-center gap-2 overflow-x-auto z-20">
          <label className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-lg border-2 border-white/30 cursor-pointer shadow-md"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <div className="w-px h-6 bg-border/30 shrink-0" />
          {COLORS.slice(0, 20).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 shrink-0 rounded-lg border transition-all",
                color === c ? "border-white/60 scale-110 shadow-md" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
