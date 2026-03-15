import { useState, useCallback, useMemo } from "react";
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
  Share2,
  Film,
  Loader2,
  Play,
  Send,
  Search,
  MapPin,
  User,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Design = {
  id: number;
  imageUrl: string;
  printImageUrl?: string | null;
  printSpec?: string | null;
  videoUrl?: string | null;
  userPrompt: string;
  nickname?: string | null;
  style?: string | null;
  bodyPlacement?: string | null;
  sizeLabel?: string | null;
  sizeInCm?: string | null;
  createdAt: Date;
};

type Artist = {
  id: number;
  name: string;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  contactEmail?: string | null;
  specialties?: string | null;
  profilePhotoUrl?: string | null;
};

export default function MyTatts() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Send to Artist state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDesign, setSendDesign] = useState<Design | null>(null);
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");

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

  const shareMutation = trpc.sharing.create.useMutation();
  const [videoGenId, setVideoGenId] = useState<number | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});

  const videoMutation = trpc.tattoo.generateVideo.useMutation({
    onSuccess: (data, variables) => {
      setVideoUrls((prev) => ({ ...prev, [variables.generationId]: data.videoUrl }));
      setVideoGenId(null);
      toast.success("Animated reveal ready!");
    },
    onError: (err) => {
      setVideoGenId(null);
      toast.error(err.message || "Video generation failed.");
    },
  });

  const handleGenerateVideo = (design: Design) => {
    setVideoGenId(design.id);
    videoMutation.mutate({ generationId: design.id });
  };

  const renameMutation = trpc.myTatts.rename.useMutation({
    onSuccess: () => {
      toast.success("Design renamed");
      setEditingId(null);
      void refetch();
    },
    onError: () => toast.error("Failed to rename design"),
  });

  const sendDesignMutation = trpc.sendDesign.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Design sent to ${data.artistName}! They'll receive it at ${data.artistEmail}.`);
      setSendDialogOpen(false);
      setSendDesign(null);
      setSelectedArtist(null);
      setCustomerPhone("");
      setPreferredDate("");
      setNotes("");
    },
    onError: (err) => toast.error(err.message || "Failed to send design."),
  });

  // Artist search query
  const artistSearchInput = useMemo(() => ({ name: artistSearch || undefined, limit: 20 }), [artistSearch]);
  const { data: artistResults } = trpc.artists.list.useQuery(artistSearchInput, {
    enabled: sendDialogOpen,
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

  const handleShare = async (design: Design) => {
    try {
      const res = await shareMutation.mutateAsync({ tattooGenerationId: design.id });
      const shareUrl = `${window.location.origin}/share?id=${res.shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to generate share link.");
    }
  };

  const openInDrawingBoard = (design: Design) => {
    const url = encodeURIComponent(design.printImageUrl || design.imageUrl);
    navigate(`/draw?image=${url}&id=${design.id}`);
  };

  const openSendDialog = useCallback((design: Design) => {
    setSendDesign(design);
    setSelectedArtist(null);
    setArtistSearch("");
    setCustomerPhone("");
    setPreferredDate("");
    setNotes("");
    setSendDialogOpen(true);
  }, []);

  const handleSendToArtist = () => {
    if (!sendDesign || !selectedArtist) return;
    sendDesignMutation.mutate({
      generationId: sendDesign.id,
      artistId: selectedArtist.id,
      customerPhone: customerPhone || undefined,
      preferredDate: preferredDate || undefined,
      notes: notes || undefined,
    });
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
          <h2 className="text-xl font-bold mb-2">Your Saved Designs</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Sign in to view and manage all your AI-generated tattoo designs.
          </p>
        </div>
        <Link href="/login">
          <Button className="gap-2">
            <LogIn size={16} /> Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="container py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookMarked size={22} className="text-primary" />
              My Designs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {designs?.length ?? 0} saved design{designs?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/studio">
            <Button className="gap-2">
              <Sparkles size={16} /> New Design
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : !designs?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <ImageOff size={48} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No designs yet</p>
            <Link href="/studio">
              <Button variant="outline" className="gap-2">
                <Sparkles size={14} /> Create your first design
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {designs.map((design) => (
              <div
                key={design.id}
                className="group relative rounded-xl overflow-hidden border border-border/20 bg-card hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-muted/20">
                  <img
                    src={design.printImageUrl || design.imageUrl}
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
                    {/* Send to Artist */}
                    <Button
                      size="sm"
                      onClick={() => openSendDialog(design)}
                      className="w-full gap-1.5 bg-cyan-500/80 hover:bg-cyan-500 text-white text-xs h-8"
                    >
                      <Send size={12} /> Send to Artist
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleShare(design)}
                      disabled={shareMutation.isPending}
                      className="w-full gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs h-8"
                    >
                      <Share2 size={12} /> Share Link
                    </Button>
                    {/* Animated Reveal Video */}
                    {videoUrls[design.id] || design.videoUrl ? (
                      <Button
                        size="sm"
                        onClick={() => window.open(videoUrls[design.id] || design.videoUrl!, "_blank")}
                        className="w-full gap-1.5 bg-purple-500/80 hover:bg-purple-500 text-white text-xs h-8"
                      >
                        <Play size={12} /> Watch Reveal
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateVideo(design)}
                        disabled={videoGenId === design.id}
                        className="w-full gap-1.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/20 text-xs h-8"
                      >
                        {videoGenId === design.id ? (
                          <><Loader2 size={12} className="animate-spin" /> Animating…</>
                        ) : (
                          <><Film size={12} /> Animate (5 cr)</>
                        )}
                      </Button>
                    )}
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

      {/* ── Send to Artist Dialog ─────────────────────────────────────────────── */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={18} className="text-cyan-400" />
              Send Design to Artist
            </DialogTitle>
            <DialogDescription>
              Your design will be emailed directly to the artist with print-ready specs, placement, and your booking details so they can prepare for your appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Design preview */}
            {sendDesign && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                <img
                  src={sendDesign.printImageUrl || sendDesign.imageUrl}
                  alt="Design"
                  className="w-14 h-14 rounded-lg object-cover border border-border/30 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{sendDesign.nickname || sendDesign.userPrompt.slice(0, 50)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sendDesign.style && <span className="text-[10px] text-primary">{sendDesign.style}</span>}
                    {sendDesign.bodyPlacement && <span className="text-[10px] text-muted-foreground">· {sendDesign.bodyPlacement}</span>}
                    {sendDesign.sizeLabel && <span className="text-[10px] text-muted-foreground">· {sendDesign.sizeLabel}</span>}
                    {sendDesign.sizeInCm && <span className="text-[10px] text-muted-foreground">({sendDesign.sizeInCm})</span>}
                  </div>
                  {sendDesign.printSpec && (
                    <p className="text-[10px] text-primary/60 font-mono mt-0.5">{sendDesign.printSpec}</p>
                  )}
                </div>
              </div>
            )}

            {/* Artist search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Choose Artist or Studio</Label>
              {selectedArtist ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  {selectedArtist.profilePhotoUrl ? (
                    <img src={selectedArtist.profilePhotoUrl} alt={selectedArtist.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedArtist.name}</p>
                    {(selectedArtist.city || selectedArtist.country) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} />
                        {[selectedArtist.city, selectedArtist.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {selectedArtist.contactEmail && (
                      <p className="text-[10px] text-cyan-400/70">{selectedArtist.contactEmail}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedArtist(null)}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by artist or studio name…"
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {artistResults && artistResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border/30 divide-y divide-border/20">
                      {artistResults.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setSelectedArtist(a)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
                        >
                          {a.profilePhotoUrl ? (
                            <img src={a.profilePhotoUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User size={12} className="text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{a.name}</p>
                            {(a.city || a.country) && (
                              <p className="text-xs text-muted-foreground">
                                {[a.city, a.country].filter(Boolean).join(", ")}
                              </p>
                            )}
                            {!a.contactEmail && (
                              <p className="text-[10px] text-amber-400/70">No email on file</p>
                            )}
                          </div>
                          {a.contactEmail && <Check size={12} className="text-cyan-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                  {artistSearch && artistResults?.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No artists found. Try a different name or{" "}
                      <Link href="/artists" className="text-primary underline">browse the directory</Link>.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Booking details */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Your Booking Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone (optional)</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">Preferred Date (optional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs text-muted-foreground">Notes for the artist (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details, references, or questions for the artist…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            {/* Send button */}
            <Button
              onClick={handleSendToArtist}
              disabled={!selectedArtist || !selectedArtist.contactEmail || sendDesignMutation.isPending}
              className="w-full gap-2 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {sendDesignMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Sending…</>
              ) : (
                <><Send size={16} /> Send Design to {selectedArtist?.name || "Artist"}</>
              )}
            </Button>
            {selectedArtist && !selectedArtist.contactEmail && (
              <p className="text-xs text-amber-400 text-center -mt-2">
                This artist has no email address on file. Please choose a different artist.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
