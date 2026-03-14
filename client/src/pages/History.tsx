import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Printer, Sparkles, Loader2, X, History as HistoryIcon, LogIn } from "lucide-react";
import { TATTOO_STYLES } from "../../../shared/tattooStyles";
import { BODY_PLACEMENTS } from "../../../shared/tattoo";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function History() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("tatt-ooo-session");
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem("tatt-ooo-session", id);
    return id;
  });
  const [lightboxItem, setLightboxItem] = useState<{
    imageUrl: string;
    userPrompt: string;
    refinedPrompt?: string | null;
    style?: string | null;
    bodyPlacement?: string | null;
    sizeLabel?: string | null;
    createdAt: Date;
  } | null>(null);

  const { data: designs, isLoading } = trpc.tattoo.history.useQuery(
    { sessionId },
    { enabled: !loading }
  );

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tatt-ooo-${prompt.slice(0, 30).replace(/\s+/g, "-")}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Design downloaded!");
    } catch {
      window.open(url, "_blank");
    }
  };

  const handlePrint = (url: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>tatt-ooo — Print Design</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;}img{max-width:100%;max-height:100vh;object-fit:contain;}@media print{body{margin:0;}}</style>
      </head><body><img src="${url}" onload="window.print()"/></body></html>
    `);
    win.document.close();
  };

  const styleName = (id: string | null | undefined) =>
    TATTOO_STYLES.find((s) => s.id === id)?.name || id || "Custom";

  const placementName = (id: string | null | undefined) =>
    BODY_PLACEMENTS.find((p) => p.value === id)?.label || id || "";

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HistoryIcon size={18} className="text-primary" />
                <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                  My Designs
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? `${designs?.length || 0} design${(designs?.length || 0) !== 1 ? "s" : ""} saved to your account`
                  : "Your session designs — sign in to save permanently"}
              </p>
            </div>
            <Button
              onClick={() => navigate("/studio")}
              className="gap-2 bg-primary hover:bg-primary/90 glow-ink"
              size="sm"
            >
              <Sparkles size={14} />
              New Design
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sign-in prompt for guests */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sign in to save your designs</p>
                <p className="text-xs text-muted-foreground">Currently showing designs from this session only</p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/login")}
            >
              <LogIn size={14} /> Sign In
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : !designs || designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <HistoryIcon size={24} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-center">No designs yet in your history.</p>
            <Button onClick={() => navigate("/studio")} className="gap-2 bg-primary hover:bg-primary/90">
              <Sparkles size={14} /> Create Your First Design
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {designs.map((design) => (
              <div
                key={design.id}
                className="rounded-xl overflow-hidden border border-border/30 bg-card/40 group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="relative aspect-square">
                  <img
                    src={design.imageUrl}
                    alt={design.userPrompt}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightboxItem(design)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleDownload(design.imageUrl, design.userPrompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                    >
                      <Download size={13} /> Download
                    </button>
                    <button
                      onClick={() => handlePrint(design.imageUrl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                    >
                      <Printer size={13} /> Print
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-foreground font-medium line-clamp-2 mb-2">
                    {design.userPrompt}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {design.style && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary/70">
                        {styleName(design.style)}
                      </Badge>
                    )}
                    {design.bodyPlacement && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 text-muted-foreground">
                        {placementName(design.bodyPlacement)}
                      </Badge>
                    )}
                    {design.sizeLabel && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/40 text-muted-foreground">
                        {design.sizeLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDate(design.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden border border-border/40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <X size={16} />
            </button>
            <img
              src={lightboxItem.imageUrl}
              alt={lightboxItem.userPrompt}
              className="w-full object-contain max-h-[60vh]"
            />
            <div className="p-4">
              <p className="text-sm font-medium text-foreground mb-1">{lightboxItem.userPrompt}</p>
              {lightboxItem.refinedPrompt && lightboxItem.refinedPrompt !== lightboxItem.userPrompt && (
                <p className="text-xs text-muted-foreground mb-3 italic line-clamp-3">
                  AI refined: {lightboxItem.refinedPrompt}
                </p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                  {lightboxItem.style && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/70">
                      {styleName(lightboxItem.style)}
                    </Badge>
                  )}
                  {lightboxItem.bodyPlacement && (
                    <Badge variant="outline" className="text-xs">
                      {placementName(lightboxItem.bodyPlacement)}
                    </Badge>
                  )}
                  {lightboxItem.sizeLabel && (
                    <Badge variant="outline" className="text-xs">
                      {lightboxItem.sizeLabel}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground self-center">
                    {formatDate(lightboxItem.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleDownload(lightboxItem.imageUrl, lightboxItem.userPrompt)}
                  >
                    <Download size={13} /> Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handlePrint(lightboxItem.imageUrl)}
                  >
                    <Printer size={13} /> Print
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
