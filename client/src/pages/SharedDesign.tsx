import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download,
  Printer,
  Share2,
  Instagram,
  ArrowRight,
  Sparkles,
  Copy,
} from "lucide-react";

export default function SharedDesign() {
  const shareId = new URLSearchParams(window.location.search).get("id") || "";

  const { data, isLoading, error } = trpc.sharing.get.useQuery(
    { shareId },
    { enabled: !!shareId }
  );

  const handleDownload = async () => {
    if (!data?.design.imageUrl) return;
    try {
      const response = await fetch(data.design.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tatt-ooo-design-${shareId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed. Try right-clicking the image.");
    }
  };

  const handlePrint = () => {
    if (!data?.design.imageUrl) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>tatt-ooo — Print Ready Design</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: white; font-family: sans-serif; }
            img { max-width: 100%; height: auto; }
            .meta { margin-top: 12px; font-size: 11px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <img src="${data.design.imageUrl}" />
          <div class="meta">
            tatt-ooo AI Tattoo Design${data.design.printSpec ? ` · ${data.design.printSpec}` : ""}
            ${data.design.style ? ` · ${data.design.style}` : ""}
          </div>
          <script>window.onload = () => { window.print(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleShareInstagram = () => {
    toast.info(
      "To share on Instagram: download the image, then upload it to your Instagram story or feed.",
      { duration: 5000 }
    );
  };

  if (!shareId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No share ID provided.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading design…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Design not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This share link may have expired or been removed.
          </p>
          <Link href="/">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
              Create Your Own Design
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { design } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="text-xl font-black tracking-wider cursor-pointer">
            tatt<span className="text-cyan-400">-ooo</span>
          </div>
        </Link>
        <Link href="/studio">
          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Create Yours
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Design image */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl mb-6">
          <img
            src={design.imageUrl}
            alt="Shared tattoo design"
            className="w-full object-contain max-h-[60vh]"
          />
        </div>

        {/* Meta */}
        <div className="mb-6">
          {design.nickname && (
            <h1 className="text-2xl font-bold text-foreground mb-1">{design.nickname}</h1>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {design.style && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {design.style}
              </span>
            )}
            {design.bodyPlacement && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {design.bodyPlacement}
              </span>
            )}
            {design.printSpec && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                {design.printSpec}
              </span>
            )}
          </div>
          {design.userPrompt && (
            <p className="text-sm text-muted-foreground italic">"{design.userPrompt}"</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Button
            variant="outline"
            className="border-border hover:border-cyan-500/40 flex flex-col gap-1 h-auto py-3"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">Download</span>
          </Button>
          <Button
            variant="outline"
            className="border-border hover:border-cyan-500/40 flex flex-col gap-1 h-auto py-3"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            <span className="text-xs">Print</span>
          </Button>
          <Button
            variant="outline"
            className="border-border hover:border-pink-500/40 flex flex-col gap-1 h-auto py-3"
            onClick={handleShareInstagram}
          >
            <Instagram className="w-4 h-4" />
            <span className="text-xs">Instagram</span>
          </Button>
          <Button
            variant="outline"
            className="border-border hover:border-cyan-500/40 flex flex-col gap-1 h-auto py-3"
            onClick={handleCopyLink}
          >
            <Copy className="w-4 h-4" />
            <span className="text-xs">Copy Link</span>
          </Button>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Design your own tattoo with AI</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Describe your idea, choose your style and body placement — get a print-ready design in
            seconds.
          </p>
          <Link href="/studio">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
              Start Designing Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
