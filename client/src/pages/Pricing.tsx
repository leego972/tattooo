import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Zap, Star, Infinity, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PACKS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$9.99",
    credits: 50,
    icon: Zap,
    color: "border-zinc-700 hover:border-zinc-500",
    badge: null,
    features: [
      "50 tattoo designs",
      "All tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & print",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$24.99",
    credits: 150,
    icon: Star,
    color: "border-cyan-500 hover:border-cyan-400",
    badge: "Most Popular",
    features: [
      "150 tattoo designs",
      "All tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & print",
      "Priority generation",
    ],
  },
  {
    id: "unlimited" as const,
    name: "Unlimited",
    price: "$49.99/mo",
    credits: null,
    icon: Infinity,
    color: "border-zinc-700 hover:border-zinc-500",
    badge: null,
    features: [
      "Unlimited tattoo designs",
      "All tattoo styles",
      "Print-ready 300 DPI files",
      "Body placement preview",
      "Drawing board editor",
      "Download & print",
      "Priority generation",
      "Cancel anytime",
    ],
  },
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
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Fuel Your Creativity
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Every new account starts with <span className="text-cyan-400 font-semibold">5 free designs</span>. 
            Top up whenever you need more.
          </p>
          {isAuthenticated && balance !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm">
              <span className="text-zinc-400">Your balance:</span>
              <span className="text-cyan-400 font-bold">{balance.balance === 99999 ? "∞" : balance.balance} credits</span>
            </div>
          )}
        </div>

        {/* Free tier banner */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-white mb-1">Free Tier — Always Available</div>
            <div className="text-zinc-400 text-sm">Every new account gets 5 free tattoo designs. No credit card required.</div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map((pack) => {
            const Icon = pack.icon;
            const isLoading = checkoutMutation.isPending && checkoutMutation.variables?.packId === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative bg-zinc-900/60 border-2 ${pack.color} rounded-2xl p-6 transition-all duration-200`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    {pack.badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{pack.name}</div>
                    <div className="text-zinc-400 text-xs">
                      {pack.credits ? `${pack.credits} credits` : "Unlimited"}
                    </div>
                  </div>
                </div>

                <div className="text-3xl font-bold text-white mb-5">{pack.price}</div>

                <ul className="space-y-2.5 mb-6">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuy(pack.id)}
                  disabled={isLoading}
                  className={`w-full h-10 font-semibold ${
                    pack.badge
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black"
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

        {/* Payment success note */}
        <p className="text-center text-zinc-500 text-sm mt-8">
          Secure payments via Stripe. Credits are added instantly after payment.
        </p>
      </div>
    </div>
  );
}
