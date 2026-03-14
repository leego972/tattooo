import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tool types ────────────────────────────────────────────────────────────────
type Tool = "select" | "brush" | "eraser" | "text" | "line" | "circle" | "rect";

const COLORS = [
  "#000000", "#ffffff", "#1a1a2e", "#16213e",
  "#e94560", "#0f3460", "#533483", "#e94560",
  "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3",
  "#54a0ff", "#5f27cd", "#00d2d3", "#01aaa4",
  "#10ac84", "#ee5a24", "#c0392b", "#8e44ad",
  "#2980b9", "#27ae60", "#f39c12", "#d35400",
  "#7f8c8d", "#bdc3c7", "#2c3e50", "#95a5a6",
];

export default function DrawingBoard() {
  const [location] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(8);
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
  const [canvasSize] = useState({ w: 1024, h: 1024 });

  // Drawing state refs (avoid stale closures)
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const shapeStart = useRef<{ x: number; y: number } | null>(null);
  const overlaySnap = useRef<ImageData | null>(null);

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
        // Fit image to canvas maintaining aspect ratio
        const scale = Math.min(canvasSize.w / img.width, canvasSize.h / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvasSize.w - w) / 2;
        const y = (canvasSize.h - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        saveSnapshot();
      };
      img.onerror = () => {
        saveSnapshot();
      };
      img.src = bgImageUrl;
    } else {
      saveSnapshot();
    }
  }, [bgImageUrl, canvasSize]);

  // ── Snapshot helpers ───────────────────────────────────────────────────────
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-30), snap]);
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
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // ── Drawing handlers ───────────────────────────────────────────────────────
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (activeTool === "text") {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    lastPos.current = pos;
    shapeStart.current = pos;

    if (["line", "circle", "rect"].includes(activeTool)) {
      // Save canvas state for shape preview
      overlaySnap.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (activeTool === "brush" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
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
    const canvas = canvasRef.current!;
    const overlay = overlayRef.current!;
    const ctx = canvas.getContext("2d")!;
    const octx = overlay.getContext("2d")!;

    if (activeTool === "brush" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = opacity / 100;
      ctx.stroke();
      ctx.globalAlpha = 1;
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

    // Suppress unused var warning
    void octx;
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
    a.click();
    toast.success("Design exported as PNG!");
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
    { id: "select", icon: <Move size={16} />, label: "Select", shortcut: "V" },
    { id: "brush", icon: <Brush size={16} />, label: "Brush", shortcut: "B" },
    { id: "eraser", icon: <Eraser size={16} />, label: "Eraser", shortcut: "E" },
    { id: "text", icon: <Type size={16} />, label: "Text", shortcut: "T" },
    { id: "line", icon: <Minus size={16} />, label: "Line" },
    { id: "circle", icon: <Circle size={16} />, label: "Circle" },
    { id: "rect", icon: <Square size={16} />, label: "Rectangle" },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0a0f]">
      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/30 bg-card/40 backdrop-blur px-3 py-2 flex items-center gap-2 flex-wrap">
        {/* Back */}
        <a href="/my-tatts" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-2">
          <ChevronLeft size={14} /> My Tatts
        </a>

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Tools */}
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTool(t.id); setShowTextInput(false); }}
            title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              activeTool === t.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Size</span>
          <input
            type="range" min={1} max={80} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-5">{brushSize}</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:block">Opacity</span>
          <input
            type="range" min={5} max={100} value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-6">{opacity}%</span>
        </div>

        {/* Font size (text tool) */}
        {activeTool === "text" && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Font</span>
            <input
              type="range" min={10} max={120} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-16 accent-primary"
            />
            <span className="text-[10px] text-muted-foreground w-6">{fontSize}</span>
          </div>
        )}

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={undoStack.length <= 1}
          title="Undo (Ctrl+Z)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30"
        >
          <Redo2 size={15} />
        </button>

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Zoom */}
        <button onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ZoomIn size={14} />
        </button>
        <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <ZoomOut size={14} />
        </button>
        <button onClick={() => setZoom(1)} title="Reset zoom" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5">
          <RotateCcw size={13} />
        </button>

        <div className="flex-1" />

        {/* Clear */}
        <button
          onClick={clearCanvas}
          title="Clear canvas"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={14} />
        </button>

        {/* Export */}
        <Button size="sm" onClick={exportCanvas} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
          <Download size={13} /> Export
        </Button>
        <Button size="sm" onClick={printCanvas} variant="outline" className="gap-1.5 text-xs h-8 border-border/30">
          <Printer size={13} /> Print
        </Button>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left colour panel ─────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-col w-14 border-r border-border/20 bg-card/20 p-2 gap-2 overflow-y-auto">
          {/* Current colour swatch */}
          <div
            className="w-10 h-10 rounded-xl border-2 border-white/20 mx-auto cursor-pointer shadow-lg"
            style={{ backgroundColor: color }}
            title="Current colour"
          />

          {/* Custom colour picker */}
          <label className="relative w-10 h-10 mx-auto cursor-pointer" title="Custom colour">
            <div className="w-10 h-10 rounded-xl border border-border/30 bg-muted/20 flex items-center justify-center hover:bg-white/5">
              <Pipette size={14} className="text-muted-foreground" />
            </div>
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          <div className="w-8 h-px bg-border/20 mx-auto" />

          {/* Colour palette */}
          <div className="flex flex-col gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 mx-auto rounded-lg border transition-all hover:scale-110",
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
          style={{ cursor: activeTool === "eraser" ? "cell" : activeTool === "text" ? "text" : activeTool === "select" ? "default" : "crosshair" }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease",
              position: "relative",
              boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
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
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur border-t border-border/20 px-3 py-2 flex items-center gap-2 overflow-x-auto z-20">
          <label className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-lg border-2 border-white/30 cursor-pointer"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setColor(e.target.value); }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          {COLORS.slice(0, 16).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 shrink-0 rounded-lg border transition-all",
                color === c ? "border-white/60 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
