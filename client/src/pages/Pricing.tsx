import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Zap, Star, Infinity, Loader2, Shield, Download, Video, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PACKS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$9.99",
    credits: 5000,
    icon: Zap,
    color: "border-zinc-700 hover:border-zinc-500",
    badge: null,
    features: [
      "5,000 tattoo design credits",
      "All 40+ tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & share",
      "Skin overlay preview",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$24.99",
    credits: 15000,
    icon: Star,
    color: "border-cyan-500 hover:border-cyan-400",
    badge: "Most Popular",
    features: [
      "15,000 tattoo design credits",
      "All 40+ tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & share",
      "Skin overlay preview",
      "3-variation comparison",
      "Animated reveal video (5 cr)",
      "Priority generation",
    ],
  },
  {
    id: "unlimited" as const,
    name: "Unlimited",
    price: "$49.99/mo",
    credits: null,
    icon: Infinity,
    color: "border-amber-500/60 hover:border-amber-400",
    badge: "Best Value",
    features: [
      "Unlimited tattoo designs",
      "All 40+ tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & share",
      "Skin overlay preview",
      "3-variation comparison",
      "Unlimited animated reveals",
      "Priority generation",
      "Cancel anytime",
    ],
  },
];

const FEATURES = [
  { icon: Palette, label: "40+ Styles", desc: "Black & Grey, Neo-Trad, Watercolour, Geometric, Japanese & more" },
  { icon: Download, label: "Print-Ready", desc: "300 DPI PNG files sized to your exact body placement" },
  { icon: Video, label: "Animated Reveal", desc: "Cinematic ink-reveal video of your tattoo design" },
  { icon: Shield, label: "Secure Payments", desc: "All transactions processed securely via Stripe" },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: balance } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });

  const checkoutMutation = trpc.credits.checkout.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
      toast.success("Redirecting to secure checkout...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const handleBuy = (packId: "starter" | "pro" | "unlimited") => {
    if (!isAuthenticated) {
      toast.error("Please sign in to purchase credits.");
      navigate("/login");
      return;
    }
    checkoutMutation.mutate({ packId, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Fuel Your Creativity
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Every new account starts with{" "}
            <span className="text-cyan-400 font-semibold">500 free credits</span>.
            Top up whenever you need more.
          </p>
          {isAuthenticated && balance !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm">
              <span className="text-zinc-400">Your balance:</span>
              <span className="text-cyan-400 font-bold">
                {balance.balance === 99999 ? "∞" : balance.balance.toLocaleString()} credits
              </span>
            </div>
          )}
        </div>

        {/* Free tier banner */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-white mb-1">Free Tier — Always Available</div>
            <div className="text-zinc-400 text-sm">
              Every new account gets <span className="text-cyan-400 font-medium">500 free credits</span> — enough for hundreds of designs. No credit card required.
            </div>
          </div>
          <Button
            onClick={() => navigate(isAuthenticated ? "/studio" : "/login")}
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 whitespace-nowrap"
          >
            {isAuthenticated ? "Go to Studio" : "Start Free"}
          </Button>
        </div>

        {/* Paid packs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PACKS.map((pack) => {
            const Icon = pack.icon;
            const isLoading = checkoutMutation.isPending && checkoutMutation.variables?.packId === pack.id;
            const isUnlimited = pack.id === "unlimited";

            return (
              <div
                key={pack.id}
                className={`relative bg-zinc-900/60 border-2 ${pack.color} rounded-2xl p-6 transition-all duration-200 ${isUnlimited ? "bg-gradient-to-b from-amber-950/20 to-zinc-900/60" : ""}`}
              >
                {pack.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${pack.id === "unlimited" ? "bg-amber-500 text-black" : "bg-cyan-500 text-black"}`}>
                    {pack.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlimited ? "bg-amber-500/10" : "bg-zinc-800"}`}>
                    <Icon className={`w-5 h-5 ${isUnlimited ? "text-amber-400" : "text-cyan-400"}`} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{pack.name}</div>
                    <div className="text-zinc-400 text-xs">
                      {pack.credits ? `${pack.credits.toLocaleString()} credits` : "Unlimited credits"}
                    </div>
                  </div>
                </div>

                <div className="text-3xl font-bold text-white mb-5">{pack.price}</div>

                <ul className="space-y-2.5 mb-6">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${isUnlimited ? "text-amber-400" : "text-cyan-400"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuy(pack.id)}
                  disabled={isLoading}
                  className={`w-full h-10 font-semibold ${
                    pack.id === "pro"
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                      : pack.id === "unlimited"
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Get ${pack.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
              <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="font-semibold text-white text-sm mb-1">{label}</div>
              <div className="text-zinc-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        {/* Artist CTA */}
        <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/40 border border-zinc-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white text-lg mb-1">Are you a tattoo artist?</div>
            <div className="text-zinc-400 text-sm">
              Join our directory for <span className="text-amber-400 font-medium">$99/year</span> and get clients referred directly to you.
              Only <span className="text-amber-400 font-medium">15% commission</span> on first bookings.
            </div>
          </div>
          <Button
            onClick={() => navigate("/artist-signup")}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold whitespace-nowrap"
          >
            Join as Artist
          </Button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          Secure payments via Stripe. Credits are added instantly after payment. No hidden fees.
        </p>
      </div>
    </div>
  );
}
