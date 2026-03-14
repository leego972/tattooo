import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  Pencil,
  Printer,
  Sparkles,
  BookMarked,
  Check,
  X,
  PenTool,
  LogIn,
  ImageOff,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type Design = {
  id: number;
  imageUrl: string;
  printImageUrl?: string | null;
  printSpec?: string | null;
  userPrompt: string;
  nickname?: string | null;
  style?: string | null;
  bodyPlacement?: string | null;
  sizeLabel?: string | null;
  sizeInCm?: string | null;
  createdAt: Date;
};

export default function MyTatts() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: designs, isLoading, refetch } = trpc.myTatts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.myTatts.delete.useMutation({
    onSuccess: () => {
      toast.success("Design deleted");
      setDeletingId(null);
      void refetch();
    },
    onError: () => toast.error("Failed to delete design"),
  });

  const renameMutation = trpc.myTatts.rename.useMutation({
    onSuccess: () => {
      toast.success("Design renamed");
      setEditingId(null);
      void refetch();
    },
    onError: () => toast.error("Failed to rename design"),
  });

  const handleDownload = async (design: Design) => {
    const url = design.printImageUrl || design.imageUrl;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tatt-ooo-${design.nickname || design.id}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(design.printSpec ? `Downloaded — ${design.printSpec}` : "Design downloaded!");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handlePrint = (design: Design) => {
    const url = design.printImageUrl || design.imageUrl;
    const win = window.open("", "_blank");
    if (!win) return;
    const specNote = design.printSpec
      ? `<p style="font-family:monospace;font-size:11px;color:#666;margin-top:8px;text-align:center">${design.printSpec} · Print-ready 300 DPI</p>`
      : "";
    win.document.write(`
      <html><head><title>tatt-ooo — ${design.nickname || "Tattoo Design"}</title>
      <style>
        body { margin:0; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; background:#fff; padding:20px; box-sizing:border-box; }
        img { max-width:100%; max-height:90vh; object-fit:contain; }
        @media print { body { margin:0; padding:0; } p { display:none; } }
      </style></head>
      <body><img src="${url}" onload="window.print()"/>${specNote}</body></html>
    `);
    win.document.close();
  };

  const startEdit = (design: Design) => {
    setEditingId(design.id);
    setEditValue(design.nickname || design.userPrompt.slice(0, 60));
  };

  const confirmEdit = (id: number) => {
    if (!editValue.trim()) return;
    renameMutation.mutate({ id, nickname: editValue.trim() });
  };

  const openInDrawingBoard = (design: Design) => {
    const url = encodeURIComponent(design.printImageUrl || design.imageUrl);
    navigate(`/draw?image=${url}&id=${design.id}`);
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-6 px-4">
        <BookMarked size={48} className="text-primary/40" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Personal Collection</h2>
          <p className="text-muted-foreground max-w-sm">
            Sign in to save and manage all your AI-generated tattoo designs in one place.
          </p>
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <LogIn size={16} />
          Sign In to View My Tatts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BookMarked size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">My Tatts</h1>
              <p className="text-xs text-muted-foreground">
                {user?.name ? `${user.name}'s collection` : "Your saved designs"}
                {designs ? ` · ${designs.length} design${designs.length !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
          <Link href="/studio">
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles size={14} />
              <span className="hidden sm:inline">New Design</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card/50 border border-border/20 overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted/30" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted/30 rounded w-3/4" />
                  <div className="h-3 bg-muted/20 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !designs || designs.length === 0 ? (
          // ── Empty state ────────────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-full bg-card/50 border border-border/20 flex items-center justify-center">
              <ImageOff size={32} className="text-muted-foreground/40" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">No designs yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Head to the Studio, describe your tattoo idea, and your designs will appear here automatically.
              </p>
            </div>
            <Link href="/studio">
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles size={16} />
                Start Designing
              </Button>
            </Link>
          </div>
        ) : (
          // ── Gallery grid ───────────────────────────────────────────────────
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(designs as Design[]).map((design) => (
              <div
                key={design.id}
                className="group rounded-2xl bg-card/50 border border-border/20 overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                {/* ── Image ─────────────────────────────────────────────── */}
                <div className="relative aspect-square overflow-hidden bg-muted/20">
                  <img
                    src={design.imageUrl}
                    alt={design.nickname || design.userPrompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover overlay with action buttons */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(design)}
                      className="w-full gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-8"
                    >
                      <Download size={12} /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePrint(design)}
                      className="w-full gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-8"
                    >
                      <Printer size={12} /> Print
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openInDrawingBoard(design)}
                      className="w-full gap-1.5 bg-primary/80 hover:bg-primary text-white text-xs h-8"
                    >
                      <PenTool size={12} /> Edit in Board
                    </Button>
                    {/* Delete — confirm on second click */}
                    {deletingId === design.id ? (
                      <div className="flex gap-1 w-full">
                        <Button
                          size="sm"
                          onClick={() => deleteMutation.mutate({ id: design.id })}
                          disabled={deleteMutation.isPending}
                          className="flex-1 gap-1 bg-red-500/80 hover:bg-red-500 text-white text-xs h-8"
                        >
                          <Check size={11} /> Confirm
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDeletingId(null)}
                          className="flex-1 gap-1 bg-white/10 hover:bg-white/20 text-white text-xs h-8"
                        >
                          <X size={11} /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setDeletingId(design.id)}
                        className="w-full gap-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/20 text-xs h-8"
                      >
                        <Trash2 size={12} /> Delete
                      </Button>
                    )}
                  </div>

                  {/* Print spec badge */}
                  {design.printSpec && (
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] text-primary font-mono border border-primary/20">
                        <Printer size={7} /> {design.printSpec}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Card footer ───────────────────────────────────────── */}
                <div className="p-3">
                  {/* Editable name */}
                  {editingId === design.id ? (
                    <div className="flex gap-1 mb-2">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEdit(design.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        maxLength={128}
                        className="flex-1 min-w-0 text-xs bg-background border border-primary/40 rounded px-2 py-1 text-foreground outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => confirmEdit(design.id)}
                        disabled={renameMutation.isPending}
                        className="p-1 text-primary hover:text-primary/80"
                      >
                        <Check size={12} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-medium text-foreground line-clamp-2 flex-1">
                        {design.nickname || design.userPrompt.slice(0, 60)}
                        {!design.nickname && design.userPrompt.length > 60 ? "…" : ""}
                      </p>
                      <button
                        onClick={() => startEdit(design)}
                        className="shrink-0 p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        title="Rename"
                      >
                        <Pencil size={10} />
                      </button>
                    </div>
                  )}

                  {/* Meta tags */}
                  <div className="flex flex-wrap gap-1">
                    {design.style && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
                        {design.style}
                      </span>
                    )}
                    {design.bodyPlacement && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground border border-border/20">
                        {design.bodyPlacement}
                      </span>
                    )}
                    {design.sizeLabel && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground border border-border/20">
                        {design.sizeLabel}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-[9px] text-muted-foreground/40 mt-1.5">
                    {new Date(design.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
