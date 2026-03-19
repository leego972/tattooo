import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Printer, Sparkles, Loader2, ZoomIn, X, Filter } from "lucide-react";
import { TATTOO_STYLES } from "../../../shared/tattooStyles";
import { BODY_PLACEMENTS } from "../../../shared/tattoo";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Curated showcase designs — these are representative AI-generated demo images
// showing the range of styles tatt-ooo can produce
const SHOWCASE_DESIGNS = [
  { id: 1, imageUrl: "https://images.unsplash.com/photo-1590246814883-57c511e4f2f5?w=400&q=80", userPrompt: "Japanese koi fish with cherry blossoms, full sleeve", style: "japanese", bodyPlacement: "upper-arm" },
  { id: 2, imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&q=80", userPrompt: "Geometric wolf head with sacred geometry", style: "geometric", bodyPlacement: "chest" },
  { id: 3, imageUrl: "https://images.unsplash.com/photo-1562962230-16b8a6b6e5a9?w=400&q=80", userPrompt: "Fine line botanical rose with thorns", style: "fine-line", bodyPlacement: "forearm" },
  { id: 4, imageUrl: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80", userPrompt: "Traditional American eagle with banner", style: "traditional", bodyPlacement: "upper-arm" },
  { id: 5, imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80", userPrompt: "Watercolor phoenix rising from flames", style: "watercolor", bodyPlacement: "back" },
  { id: 6, imageUrl: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400&q=80", userPrompt: "Blackwork mandala with dotwork shading", style: "blackwork", bodyPlacement: "shoulder" },
  { id: 7, imageUrl: "https://images.unsplash.com/photo-1612459284970-e8f027596582?w=400&q=80", userPrompt: "Neo-traditional lion with floral crown", style: "neo-traditional", bodyPlacement: "thigh" },
  { id: 8, imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80", userPrompt: "Minimalist mountain range with moon phases", style: "minimalist", bodyPlacement: "wrist" },
  { id: 9, imageUrl: "https://images.unsplash.com/photo-1590246814883-57c511e4f2f5?w=400&q=80", userPrompt: "Realism portrait of a tiger in black and grey", style: "realism", bodyPlacement: "calf" },
  { id: 10, imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&q=80", userPrompt: "Tribal sun with Polynesian patterns", style: "tribal", bodyPlacement: "shoulder" },
  { id: 11, imageUrl: "https://images.unsplash.com/photo-1562962230-16b8a6b6e5a9?w=400&q=80", userPrompt: "Cyber sigilism skull with circuit patterns", style: "cyber-sigilism", bodyPlacement: "chest" },
  { id: 12, imageUrl: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80", userPrompt: "New school cartoon dragon breathing fire", style: "new-school", bodyPlacement: "upper-arm" },
];

export default function Gallery() {
  const [, navigate] = useLocation();
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedPlacement, setSelectedPlacement] = useState("");
  const [lightboxItem, setLightboxItem] = useState<{ imageUrl: string; userPrompt: string; style?: string | null; bodyPlacement?: string | null } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch real user-generated designs from the database
  const { data: dbDesigns = [], isLoading } = trpc.tattoo.gallery.useQuery({ limit: 100 });

  // Merge curated showcase with real designs (real designs first if available, then showcase)
  const allDesigns = dbDesigns.length >= 6
    ? dbDesigns
    : [...dbDesigns, ...SHOWCASE_DESIGNS.slice(dbDesigns.length)];

  const filtered = allDesigns.filter((d) => {
    if (selectedStyle && d.style !== selectedStyle) return false;
    if (selectedPlacement && d.bodyPlacement !== selectedPlacement) return false;
    return true;
  });

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tatt-ooo-${prompt.slice(0, 30).replace(/\s+/g, "-")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success("Design downloaded!");
    } catch {
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `tatt-ooo-${prompt.slice(0, 30).replace(/\s+/g, "-")}-${Date.now()}.png`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started!");
      } catch {
        toast.error("Download failed. Right-click the image and choose Save As.");
      }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                Design Gallery
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filtered.length} tattoo design{filtered.length !== 1 ? "s" : ""} generated
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={14} />
                Filters
                {(selectedStyle || selectedPlacement) && (
                  <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-primary text-primary-foreground">
                    {[selectedStyle, selectedPlacement].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => navigate("/studio")}
                className="gap-2 bg-primary hover:bg-primary/90 glow-ink"
                size="sm"
              >
                <Sparkles size={14} />
                Create Design
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-4 p-4 rounded-xl bg-card/40 border border-border/30">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Style</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedStyle("")}
                    className={cn("px-2.5 py-1 rounded-full border text-xs transition-all",
                      !selectedStyle ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"
                    )}
                  >All</button>
                  {TATTOO_STYLES.slice(0, 12).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStyle(selectedStyle === s.id ? "" : s.id)}
                      className={cn("px-2.5 py-1 rounded-full border text-xs transition-all",
                        selectedStyle === s.id ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"
                      )}
                    >{s.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Placement</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedPlacement("")}
                    className={cn("px-2.5 py-1 rounded-full border text-xs transition-all",
                      !selectedPlacement ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"
                    )}
                  >All</button>
                  {BODY_PLACEMENTS.slice(0, 10).map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPlacement(selectedPlacement === p.value ? "" : p.value)}
                      className={cn("px-2.5 py-1 rounded-full border text-xs transition-all",
                        selectedPlacement === p.value ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30"
                      )}
                    >{p.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-center">
              No designs yet. Be the first to create one!
            </p>
            <Button onClick={() => navigate("/studio")} className="gap-2 bg-primary hover:bg-primary/90">
              <Sparkles size={14} /> Create Your First Design
            </Button>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
            {filtered.map((design) => (
              <div
                key={design.id}
                className="break-inside-avoid rounded-xl overflow-hidden border border-border/30 bg-card/40 group hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="relative">
                  <img
                    src={design.imageUrl}
                    alt={design.userPrompt}
                    className="w-full object-cover cursor-zoom-in"
                    onClick={() => setLightboxItem(design)}
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setLightboxItem(design)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(design.imageUrl, design.userPrompt)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handlePrint(design.imageUrl)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {design.userPrompt}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
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
                  </div>
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
              className="w-full object-contain max-h-[70vh]"
            />
            <div className="p-4">
              <p className="text-sm text-foreground mb-2">{lightboxItem.userPrompt}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {lightboxItem.style && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/70">
                      {styleName(lightboxItem.style)}
                    </Badge>
                  )}
                  {lightboxItem.bodyPlacement && (
                    <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                      {placementName(lightboxItem.bodyPlacement)}
                    </Badge>
                  )}
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
