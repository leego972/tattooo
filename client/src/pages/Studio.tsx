import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import BodyAvatar, { type Gender, type BodyShape, type AvatarView } from "@/components/BodyAvatar";
import {
  Send, Paperclip, X, Sparkles, Download, Printer, RotateCcw,
  ChevronDown, ChevronUp, User, Loader2, ImageIcon, Wand2,
  Palette, MapPin, Ruler, RefreshCw, ZoomIn, Settings2,
  Layers, Droplets, SlidersHorizontal, Check, Calendar, Globe,
  Building2, Shield, CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TATTOO_STYLES, TATTOO_CATEGORIES, type TattooStyle, type TattooCategory } from "../../../shared/tattooStyles";
import { BODY_PLACEMENTS, SIZE_OPTIONS } from "../../../shared/tattoo";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const LOGO_URL = "/assets/tattooo-logo.png";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrls?: string[];
  generatedImageUrl?: string;
  printImageUrl?: string;
  printSpec?: string;
  printWidthPx?: number;
  printHeightPx?: number;
  widthCm?: number;
  heightCm?: number;
  dpi?: number;
  isGenerating?: boolean;
  timestamp: Date;
  variations?: string[];
}

const SUGGESTED_PROMPTS = [
  "A wolf howling at the moon in Japanese style",
  "Geometric rose with fine line detail",
  "Minimalist compass for my wrist",
  "Skull with roses, traditional American style",
  "Koi fish with cherry blossoms, full sleeve",
  "Cyber sigilism wolf head on my chest",
];

export default function Studio() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: creditsData, refetch: refetchCredits } = trpc.credits.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10 * 1000,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Style & options
  const [selectedStyle, setSelectedStyle] = useState<TattooStyle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TattooCategory | "All">("All");
  const [selectedPlacement, setSelectedPlacement] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedMood, setSelectedMood] = useState("");

  // Avatar
  const [gender, setGender] = useState<Gender>("male");
  const [bodyShape, setBodyShape] = useState<BodyShape>("average");
  const [avatarView, setAvatarView] = useState<AvatarView>("front");
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | undefined>();

  // Panel states (mobile collapsible)
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true);
  const [optionsPanelOpen, setOptionsPanelOpen] = useState(true);
  const [avatarPanelOpen, setAvatarPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [sessionId] = useState(() => crypto.randomUUID());
  const [variationCount, setVariationCount] = useState(1);
  const [selectedVariationIdx, setSelectedVariationIdx] = useState(0);
  const [showRuler, setShowRuler] = useState(false);
  const [showColourPicker, setShowColourPicker] = useState(false);
  const [skinPhotoUrl, setSkinPhotoUrl] = useState<string | undefined>();
  const [showSkinOverlay, setShowSkinOverlay] = useState(false);
  const skinInputRef = useRef<HTMLInputElement>(null);

  // Book an Artist modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookCountry, setBookCountry] = useState("All Countries");
  const [bookArtistId, setBookArtistId] = useState<number | null>(null);
  const [bookMsg, setBookMsg] = useState("");

  const { data: artistList = [] } = trpc.artists.list.useQuery(
    { limit: 200 },
    { enabled: showBookModal }
  );

  const filteredBookArtists = useMemo(() => {
    if (!artistList) return [];
    return artistList.filter((a) =>
      bookCountry === "All Countries" || a.country?.toLowerCase() === bookCountry.toLowerCase()
    );
  }, [artistList, bookCountry]);

  const availableCountries = useMemo(() => {
    const countries = Array.from(new Set(artistList.map((a) => a.country).filter(Boolean))) as string[];
    return ["All Countries", ...countries.sort()];
  }, [artistList]);

  const bookingMutation = trpc.artists.requestBooking.useMutation({
    onSuccess: (data: { bookingId: number; checkoutUrl: string }) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure payment...");
        window.open(data.checkoutUrl, "_blank");
      } else {
        toast.success("Booking request sent! The studio will confirm shortly.");
      }
      setShowBookModal(false);
      setBookArtistId(null);
      setBookMsg("");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to create booking."),
  });

  const generateMutation = trpc.tattoo.generate.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      // Refresh credit balance after generation
      if (isAuthenticated) refetchCredits();
      if (data.imageUrl) {
        setLastGeneratedUrl(data.imageUrl);
        setSelectedVariationIdx(0);
        setMessages((prev) =>
          prev.map((m) =>
            m.isGenerating
              ? {
                  ...m,
                  isGenerating: false,
                  generatedImageUrl: data.imageUrl,
                  printImageUrl: data.printImageUrl,
                  printSpec: data.printSpec,
                  printWidthPx: data.printWidthPx,
                  printHeightPx: data.printHeightPx,
                  widthCm: data.widthCm,
                  heightCm: data.heightCm,
                  dpi: data.dpi,
                  content: data.refinedPrompt || m.content,
                  variations: data.variations || [data.imageUrl],
                }
              : m
          )
        );
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      setMessages((prev) => prev.filter((m) => !m.isGenerating));
      if (err.message === "INSUFFICIENT_CREDITS") {
        toast.error("You've used all your credits! Top up to keep designing.", {
          action: { label: "Buy Credits", onClick: () => navigate("/pricing") },
          duration: 6000,
        });
      } else {
        toast.error(`Generation failed: ${err.message}`);
      }
    },
  });

  const uploadMutation = trpc.tattoo.uploadReference.useMutation({
    onError: (err: { message: string }) => toast.error(`Upload failed: ${err.message}`),
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          mimeType: file.type,
        });

        setUploadedImages((prev) => [
          ...prev,
          { url: result.url, name: file.name },
        ]);
        toast.success(`${file.name} uploaded`);
    } catch (_e) {
      toast.error(`Failed to upload ${file.name}`);
    }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chatMutation = trpc.tattoo.chat.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      if (data.ready && data.summary) {
        // AI has enough info — show its final message then auto-generate
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.text || "Perfect! I have everything I need. Generating your tattoo now...",
          timestamp: new Date(),
        };
        const generatingMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          isGenerating: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [
          ...prev.filter((m) => !m.isGenerating),
          assistantMsg,
          generatingMsg,
        ]);
        setIsGenerating(true);
        generateMutation.mutate({
          userPrompt: [data.summary, selectedMood ? `Mood: ${selectedMood}` : ""].filter(Boolean).join(". "),
          referenceImageUrl: pendingImageRef.current,
          style: selectedStyle?.id,
          bodyPlacement: selectedPlacement || undefined,
          sizeLabel: selectedSize || undefined,
          sessionId,
          gender: gender || undefined,
          bodyShape: bodyShape || undefined,
          variationCount,
        });
      } else {
        // AI is asking follow-up questions
        setMessages((prev) => [
          ...prev.filter((m) => !m.isGenerating),
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.text,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      setMessages((prev) => prev.filter((m) => !m.isGenerating));
      toast.error(`Chat error: ${err.message}`);
    },
  });

  // Track the reference image URL for the current conversation
  const pendingImageRef = useRef<string | undefined>(undefined);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text && uploadedImages.length === 0) return;
    if (isGenerating) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      imageUrls: uploadedImages.map((i) => i.url),
      timestamp: new Date(),
    };

    // Track uploaded image for eventual generation
    if (uploadedImages[0]?.url) {
      pendingImageRef.current = uploadedImages[0].url;
    }

    const thinkingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isGenerating: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, thinkingMsg]);
    setInput("");
    setUploadedImages([]);
    setIsGenerating(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Use the chat endpoint to ask clarifying questions before generating
    chatMutation.mutate({
      messages: updatedMessages
        .filter((m) => !m.isGenerating && (m.role === "user" || (m.role === "assistant" && m.content && !m.generatedImageUrl)))
        .map((m) => ({ role: m.role, content: m.content })),
      sessionId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleDownload = async (url: string, printSpec?: string) => {
    try {
      // Try direct download first
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tatt-ooo-design-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success(printSpec ? `Downloaded — ${printSpec}` : "Design downloaded!");
    } catch (_e) {
      // Fallback: create a link and let the browser handle it natively
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = `tatt-ooo-design-${Date.now()}.png`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started!");
      } catch (_e2) {
        toast.error("Download failed. Right-click the image and choose Save As.");
      }
    }
  };

  const handlePrint = (url: string, printSpec?: string) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const specNote = printSpec ? `<p style="font-family:monospace;font-size:11px;color:#666;margin-top:8px;text-align:center">${printSpec} · Print-ready 300 DPI</p>` : "";
    win.document.write(`
      <html><head><title>tatt-ooo — Print Tattoo Design</title>
      <style>
        body { margin: 0; display: flex; flex-direction:column; justify-content: center; align-items: center; min-height: 100vh; background: #fff; padding: 20px; box-sizing:border-box; }
        img { max-width: 100%; max-height: 90vh; object-fit: contain; }
        @media print { body { margin: 0; padding:0; } p { display:none; } }
      </style></head>
      <body><img src="${url}" onload="window.print()"/>${specNote}</body></html>
    `);
    win.document.close();
  };

  const filteredStyles =
    selectedCategory === "All"
      ? TATTOO_STYLES
      : TATTOO_STYLES.filter((s) => s.category === selectedCategory);

  const placement = BODY_PLACEMENTS.find((p) => p.value === selectedPlacement);
  const size = SIZE_OPTIONS.find((s) => s.label === selectedSize);

  return (
    <div className="flex h-screen md:h-screen overflow-hidden bg-background">
      {/* ── LEFT PANEL: Style & Options ─────────────────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col w-72 xl:w-80 border-r border-border/40 bg-card/30 overflow-hidden shrink-0",
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Style Selector */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tattoo Style
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setSelectedCategory("All")}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full border transition-all",
                  selectedCategory === "All"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/40"
                )}
              >
                All
              </button>
              {TATTOO_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full border transition-all",
                    selectedCategory === cat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {cat.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Style grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(selectedStyle?.id === style.id ? null : style)}
                  className={cn(
                    "text-left p-2 rounded-lg border transition-all text-xs",
                    selectedStyle?.id === style.id
                      ? "border-primary bg-primary/10 text-primary glow-ink"
                      : "border-border/30 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span>{style.toolEmoji}</span>
                    <span className="font-medium truncate">{style.name}</span>
                  </div>
                  <div className="text-[10px] opacity-60 truncate">{style.origin}</div>
                </button>
              ))}
            </div>

            {/* Selected style details */}
            {selectedStyle && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary">{selectedStyle.name}</span>
                  {selectedStyle.culturalSensitive && (
                    <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-400">
                      Cultural
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {selectedStyle.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground">{selectedStyle.tool}</span>
                  <span className="text-[10px] text-primary/60">·</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{selectedStyle.difficulty}</span>
                </div>
              </div>
            )}
          </div>

          {/* Placement */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Body Placement
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {BODY_PLACEMENTS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setSelectedPlacement(selectedPlacement === p.value ? "" : p.value)}
                  className={cn(
                    "text-left px-2 py-1.5 rounded-lg border transition-all text-xs",
                    selectedPlacement === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Ruler size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Size
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSize(selectedSize === s.label ? "" : s.label)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border transition-all text-xs",
                    selectedSize === s.label
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span className="font-bold">{s.label}</span>
                  <span className="ml-1 opacity-60">{s.cmRange}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={14} className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mood
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Bold", "Dark", "Elegant", "Spiritual", "Futuristic", "Minimal", "Feminine", "Masculine", "Mystical", "Luxury", "Playful", "Sacred", "Raw", "Aggressive", "Soft"].map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(selectedMood === mood ? "" : mood)}
                  className={cn(
                    "px-2.5 py-1 rounded-full border transition-all text-xs",
                    selectedMood === mood
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── CENTRE: Chat ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/20 shrink-0">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="tatt-ooo" className="w-7 h-7 rounded-full ring-1 ring-primary/30" />
            <div>
              <h1 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                tatt-ooo Studio
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedStyle ? `${selectedStyle.toolEmoji} ${selectedStyle.name}` : "Describe your tattoo idea"}
              {selectedPlacement && ` · ${placement?.label}`}
              {selectedSize && ` · ${size?.label} (${size?.cmRange})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: toggle right panel */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden gap-1 text-xs text-muted-foreground"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
            >
              <Settings2 size={14} />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setMessages([])}
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-8 px-4 py-12">
              <div className="text-center">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: "oklch(0.62 0.19 220)" }} />
                  <img src={LOGO_URL} alt="" className="relative w-20 h-20 rounded-full object-cover ring-2 ring-primary/30" />
                </div>
                <h2 className="text-xl font-bold gradient-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Describe Your Tattoo
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Tell me your idea, upload reference images, choose a style and placement — and I'll generate your perfect tattoo design.
                </p>
              </div>

              {/* Suggested prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void handleSend(prompt)}
                    disabled={isGenerating}
                    className="text-left px-4 py-3 rounded-xl border border-border/40 bg-card/40 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all disabled:opacity-50"
                  >
                    <Sparkles size={12} className="inline mr-2 text-primary opacity-60" />
                    {prompt}
                  </button>
                ))}
              </div>

              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center">
                   <button onClick={() => navigate("/login")} className="text-cyan-400 hover:underline">Sign in</button> to save your designs to history
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-4 pb-4 max-w-4xl mx-auto w-full">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <img src={LOGO_URL} alt="" className="w-6 h-6 rounded-full" />
                    </div>
                  )}

                  <div className={cn("max-w-[80%] flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
                    {/* User images */}
                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.imageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Reference"
                            className="w-20 h-20 rounded-lg object-cover border border-border/40"
                          />
                        ))}
                      </div>
                    )}

                    {/* Message bubble */}
                    {(msg.content || msg.isGenerating) && (
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border border-border/40 text-foreground rounded-tl-sm"
                        )}
                      >
                        {msg.isGenerating ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs">Generating your tattoo design...</span>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    )}

                    {/* Generated tattoo image — single or multi-variation */}
                    {msg.generatedImageUrl && (() => {
                      const allVariations = msg.variations && msg.variations.length > 1
                        ? msg.variations
                        : [msg.generatedImageUrl];
                      const isComparison = allVariations.length > 1;

                      return (
                        <div className="rounded-2xl overflow-hidden border border-primary/20 glow-ink-lg bg-card w-full">
                          {/* Variation tabs */}
                          {isComparison && (
                            <div className="flex items-center gap-1 p-2 border-b border-border/30 bg-card/50">
                              <Layers size={12} className="text-primary mr-1" />
                              <span className="text-[10px] text-muted-foreground mr-2">Variations:</span>
                              {allVariations.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedVariationIdx(i)}
                                  className={cn(
                                    "w-6 h-6 rounded-md text-[10px] font-bold border transition-all",
                                    selectedVariationIdx === i
                                      ? "border-primary bg-primary/20 text-primary"
                                      : "border-border/40 text-muted-foreground hover:border-primary/40"
                                  )}
                                >
                                  {i + 1}
                                </button>
                              ))}
                              <span className="ml-auto text-[10px] text-muted-foreground">Side-by-side</span>
                            </div>
                          )}

                          {/* Image display — single or grid */}
                          {isComparison ? (
                            <div className={cn(
                              "grid gap-1 p-1",
                              allVariations.length === 2 ? "grid-cols-2" : "grid-cols-3"
                            )}>
                              {allVariations.map((url, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                    selectedVariationIdx === i ? "border-primary" : "border-transparent"
                                  )}
                                  onClick={() => setSelectedVariationIdx(i)}
                                >
                                  <img
                                    src={url}
                                    alt={`Variation ${i + 1}`}
                                    className="w-full object-cover"
                                  />
                                  {selectedVariationIdx === i && (
                                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <Check size={10} className="text-primary-foreground" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white/80 text-center py-0.5">
                                    V{i + 1}
                                  </div>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDownload(url); }}
                                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="relative group">
                              <img
                                src={allVariations[0]}
                                alt="Generated tattoo design"
                                className="w-full max-w-sm object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(msg.printImageUrl || allVariations[0], msg.printSpec)}
                                  className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                >
                                  <Download size={14} /> Download
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePrint(msg.printImageUrl || allVariations[0], msg.printSpec)}
                                  className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                >
                                  <Printer size={14} /> Print
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="px-3 py-2.5 flex flex-col gap-1.5">
                            {msg.printSpec && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono">
                                  <Printer size={9} /> {msg.printSpec}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">Print-ready · 300 DPI</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {isComparison ? `${allVariations.length} Variations` : "Generated Design"}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDownload(
                                    (isComparison ? allVariations[selectedVariationIdx] : msg.printImageUrl) || allVariations[0],
                                    msg.printSpec
                                  )}
                                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                  <Download size={12} /> Save
                                </button>
                                <button
                                  onClick={() => handlePrint(
                                    (isComparison ? allVariations[selectedVariationIdx] : msg.printImageUrl) || allVariations[0],
                                    msg.printSpec
                                  )}
                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <Printer size={12} /> Print
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border/30 flex items-center justify-center shrink-0 mt-1">
                      <User size={14} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Area ───────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border/30 bg-card/20 p-3 sm:p-4">
          {/* Uploaded images preview */}
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-14 h-14 rounded-lg object-cover border border-border/40"
                  />
                  <button
                    onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mobile quick options */}
          <div className="flex gap-2 mb-2 lg:hidden overflow-x-auto pb-1">
            <select
              value={selectedStyle?.id || ""}
              onChange={(e) => setSelectedStyle(TATTOO_STYLES.find((s) => s.id === e.target.value) || null)}
              className="text-xs bg-card border border-border/40 rounded-lg px-2 py-1.5 text-muted-foreground shrink-0"
            >
              <option value="">Style</option>
              {TATTOO_STYLES.map((s) => (
                <option key={s.id} value={s.id}>{s.toolEmoji} {s.name}</option>
              ))}
            </select>
            <select
              value={selectedPlacement}
              onChange={(e) => setSelectedPlacement(e.target.value)}
              className="text-xs bg-card border border-border/40 rounded-lg px-2 py-1.5 text-muted-foreground shrink-0"
            >
              <option value="">Placement</option>
              {BODY_PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="text-xs bg-card border border-border/40 rounded-lg px-2 py-1.5 text-muted-foreground shrink-0"
            >
              <option value="">Size</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s.label} value={s.label}>{s.label} {s.cmRange}</option>
              ))}
            </select>
          </div>

          {/* Main input row */}
          <div className="flex gap-2 items-end">
            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl border border-border/40 flex items-center justify-center transition-all",
                isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary"
              )}
              title="Upload reference image"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>

            {/* Textarea */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedStyle
                    ? `Describe your ${selectedStyle.name} tattoo...`
                    : "Describe your tattoo idea... (e.g. 'A wolf with geometric patterns on my forearm')"
                }
                className="resize-none min-h-[42px] max-h-40 rounded-xl border-border/40 bg-card/60 text-sm pr-4 py-2.5 leading-relaxed"
                rows={1}
                style={{ fontSize: "16px" }} // Prevent iOS zoom
              />
            </div>

            {/* Send button */}
            <Button
              onClick={() => void handleSend()}
              disabled={(!input.trim() && uploadedImages.length === 0) || isGenerating}
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl p-0 transition-all",
                isGenerating
                  ? "bg-primary/50 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 glow-ink"
              )}
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>

          {/* Variation count + tool toggles */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Variation count */}
            <div className="flex items-center gap-1.5 bg-card/60 rounded-lg border border-border/30 px-2 py-1">
              <Layers size={12} className="text-primary" />
              <span className="text-[10px] text-muted-foreground">Variations:</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setVariationCount(n)}
                  className={cn(
                    "w-5 h-5 rounded text-[10px] font-bold transition-all",
                    variationCount === n
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Skin overlay toggle */}
            <button
              onClick={() => skinInputRef.current?.click()}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all",
                skinPhotoUrl
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
              title="Upload skin photo for overlay preview"
            >
              <Droplets size={11} />
              {skinPhotoUrl ? "Skin ✓" : "Skin Overlay"}
            </button>
            <input
              ref={skinInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setSkinPhotoUrl(reader.result as string);
                reader.readAsDataURL(file);
                toast.success("Skin photo loaded — overlay active");
              }}
            />
            {skinPhotoUrl && (
              <button
                onClick={() => setSkinPhotoUrl(undefined)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                <X size={10} />
              </button>
            )}

            {/* Ruler toggle */}
            <button
              onClick={() => setShowRuler(!showRuler)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all",
                showRuler
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <Ruler size={11} />
              Size Ruler
            </button>

            <p className="ml-auto text-[10px] text-muted-foreground/50 hidden sm:block">
              Enter to send · Shift+Enter for new line
            </p>
          </div>

          {/* Skin overlay preview */}
          {skinPhotoUrl && lastGeneratedUrl && (
            <div className="mt-2 p-2 bg-card/40 rounded-xl border border-primary/20">
              <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                <Droplets size={10} className="text-primary" /> Skin Overlay Preview
              </p>
              <div className="relative w-full max-w-xs mx-auto">
                <img src={skinPhotoUrl} alt="Skin" className="w-full rounded-lg object-cover opacity-80" />
                <img
                  src={lastGeneratedUrl}
                  alt="Tattoo overlay"
                  className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-70 rounded-lg"
                />
              </div>
              <p className="text-[9px] text-muted-foreground/50 text-center mt-1">
                Approximate preview — actual placement may vary
              </p>
            </div>
          )}

          {/* Size ruler overlay */}
          {showRuler && (
            <div className="mt-2 p-3 bg-card/40 rounded-xl border border-border/30">
              <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                <Ruler size={10} className="text-primary" /> Size Reference Ruler
              </p>
              {!selectedSize && (
                <p className="text-[10px] text-amber-400/80 mb-2">Select a size above to see the ruler</p>
              )}
              {selectedSize && (() => {
                const sizeOption = SIZE_OPTIONS.find(s => s.label === selectedSize);
                // Parse cm range to get max cm for ruler
                const cmMatch = sizeOption?.cmRange?.match(/(\d+)/);
                const maxCm = cmMatch ? parseInt(cmMatch[1]) + 2 : 10;
                const ticks = Array.from({ length: maxCm + 1 }, (_, i) => i);
                return (
                  <div className="space-y-3">
                    {/* Ruler bar */}
                    <div className="relative bg-zinc-900 border border-zinc-700 rounded-lg p-2 overflow-hidden">
                      <div className="flex items-end h-8 gap-0">
                        {ticks.map((cm) => (
                          <div key={cm} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                            <span className="text-[7px] text-cyan-400/70 font-mono mb-0.5">{cm}</span>
                            <div className={`w-px bg-cyan-400/60 ${cm % 5 === 0 ? 'h-4' : 'h-2'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="text-[8px] text-zinc-500 text-right mt-1">cm</div>
                    </div>
                    {/* Size info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-foreground">{sizeOption?.name || selectedSize}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{sizeOption?.cmRange}</span>
                      </div>
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {sizeOption?.description || selectedSize}
                      </span>
                    </div>
                    {lastGeneratedUrl && (
                      <div className="relative w-full max-w-xs mx-auto">
                        <img src={lastGeneratedUrl} alt="Design" className="w-full rounded-lg" />
                        {/* Scale indicator overlay */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-1">
                            <div className="h-px flex-1 bg-cyan-400/80" />
                            <span className="text-[8px] bg-black/70 text-cyan-400 px-1 py-0.5 rounded font-mono whitespace-nowrap">
                              {sizeOption?.cmRange || selectedSize}
                            </span>
                            <div className="h-px flex-1 bg-cyan-400/80" />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <div className="w-px h-2 bg-cyan-400/80" />
                            <div className="w-px h-2 bg-cyan-400/80" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Avatar Preview ──────────────────────────────────── */}
      <aside
        className={cn(
          "border-l border-border/40 bg-card/30 flex flex-col shrink-0 overflow-hidden transition-all duration-300",
          "hidden lg:flex w-64 xl:w-72",
          rightPanelOpen && "flex w-full lg:w-64 xl:w-72 absolute lg:relative inset-0 z-10 lg:z-auto"
        )}
      >
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Body Preview
            </span>
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setRightPanelOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Gender */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Gender</p>
            <div className="flex gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border text-xs capitalize transition-all",
                    gender === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {g === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Body Shape */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Body Shape</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["slim", "athletic", "average", "plus-size"] as BodyShape[]).map((shape) => (
                <button
                  key={shape}
                  onClick={() => setBodyShape(shape)}
                  className={cn(
                    "py-1.5 rounded-lg border text-xs capitalize transition-all",
                    bodyShape === shape
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Front / Back toggle */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">View</p>
            <div className="flex gap-2">
              {(["front", "back"] as AvatarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setAvatarView(v)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border text-xs capitalize transition-all",
                    avatarView === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar SVG */}
          <div className="flex-1 flex items-center justify-center bg-card/30 rounded-xl border border-border/20 p-2" style={{ minHeight: "280px" }}>
            <BodyAvatar
              gender={gender}
              bodyShape={bodyShape}
              view={avatarView}
              selectedZone={selectedPlacement}
              tattooImageUrl={lastGeneratedUrl}
              onZoneClick={(zone) => setSelectedPlacement(zone)}
            />
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Tap a body zone to select placement
          </p>

          {/* Last generated preview */}
          {lastGeneratedUrl && (
            <div className="rounded-xl overflow-hidden border border-primary/20">
              <img src={lastGeneratedUrl} alt="Latest design" className="w-full object-cover" />
              <div className="flex gap-2 p-2 flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs gap-1"
                  onClick={() => handleDownload(lastGeneratedUrl)}
                >
                  <Download size={12} /> Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs gap-1"
                  onClick={() => handlePrint(lastGeneratedUrl)}
                >
                  <Printer size={12} /> Print
                </Button>
                <Button
                  size="sm"
                  className="w-full mt-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs gap-1"
                  onClick={() => setShowBookModal(true)}
                >
                  <Calendar size={12} /> Book an Artist
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Book an Artist Modal ── */}
      <Dialog open={showBookModal} onOpenChange={(open) => { if (!open) { setShowBookModal(false); setBookArtistId(null); setBookMsg(""); } }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Book an Artist
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a country to find available studios, then send your booking request with your AI-generated design.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Country filter */}
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Select Country
              </Label>
              <select
                value={bookCountry}
                onChange={(e) => { setBookCountry(e.target.value); setBookArtistId(null); }}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Studio list */}
            {bookCountry !== "All Countries" && (
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Choose a Studio
                </Label>
                {filteredBookArtists.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No verified studios in {bookCountry} yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredBookArtists.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setBookArtistId(a.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                          bookArtistId === a.id
                            ? "border-cyan-500 bg-cyan-500/10"
                            : "border-border bg-background hover:border-cyan-500/40"
                        )}
                      >
                        {a.studioLogoUrl || a.avatarUrl ? (
                          <img
                            src={a.studioLogoUrl || a.avatarUrl || ""}
                            alt={a.name || "Studio"}
                            className="w-10 h-10 rounded-lg object-contain border border-border bg-card flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                          {a.specialties && <p className="text-[10px] text-cyan-400 truncate">{a.specialties}</p>}
                          {a.businessHours && (
                            <p className="text-[10px] text-muted-foreground">
                              {Object.entries(a.businessHours as Record<string, { open: string; close: string; closed?: boolean }>)
                                .filter(([, h]) => !h.closed)
                                .slice(0, 1)
                                .map(([day, h]) => `${day}: ${h.open}–${h.close}`)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        {bookArtistId === a.id && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Booking message */}
            {bookArtistId && (
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Message to studio</Label>
                <textarea
                  placeholder="Describe your tattoo idea, preferred dates, size, placement... Your AI design will be attached automatically."
                  value={bookMsg}
                  onChange={(e) => setBookMsg(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground min-h-[90px] resize-none"
                  minLength={10}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  The studio will review your request and send a quote. You pay the 13% booking fee online to confirm — the rest is paid directly to the artist on the day.
                </div>
                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                  disabled={bookMsg.trim().length < 10 || bookingMutation.isPending}
                  onClick={() => {
                    if (!bookArtistId) return;
                    bookingMutation.mutate({
                      artistId: bookArtistId,
                      message: bookMsg,
                      designUrl: lastGeneratedUrl,
                      origin: window.location.origin,
                    });
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {bookingMutation.isPending ? "Sending…" : "Send Booking Request"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
