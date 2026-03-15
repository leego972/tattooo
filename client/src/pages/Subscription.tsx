import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-6 h-6 text-gray-400" />,
  pro: <Star className="w-6 h-6 text-amber-400" />,
  studio: <Crown className="w-6 h-6 text-purple-400" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "border-gray-700 bg-gray-900/50",
  pro: "border-amber-500/50 bg-amber-900/10",
  studio: "border-purple-500/50 bg-purple-900/10",
};

const PLAN_BADGE: Record<string, string | null> = {
  free: null,
  pro: "Most Popular",
  studio: "Best Value",
};

export default function Subscription() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans } = trpc.subscription.getPlans.useQuery();
  const { data: status } = trpc.subscription.getStatus.useQuery(undefined, { enabled: !!user });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setLoadingPlan(null);
    },
  });

  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleUpgrade = (planId: string) => {
    if (!user) {
      toast.error("Please sign in to upgrade your plan.");
      return;
    }
    if (planId === "free") return;
    setLoadingPlan(planId);
    createCheckout.mutate({ plan: planId as "pro" | "studio", origin: window.location.origin });
  };

  const currentPlan = status?.plan || "free";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            tatooo.shop Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Design Without Limits
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            From your first tattoo idea to a full studio workflow — choose the plan that fits your vision.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans || []).map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isBestPlan = plan.id === "pro";
            return (
              <Card
                key={plan.id}
                className={`relative ${PLAN_COLORS[plan.id]} border transition-all duration-300 hover:scale-[1.02] ${
                  isBestPlan ? "ring-2 ring-amber-500/50" : ""
                }`}
              >
                {PLAN_BADGE[plan.id] && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-black font-bold px-3 py-1">
                      {PLAN_BADGE[plan.id]}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    {PLAN_ICONS[plan.id]}
                    <CardTitle className="text-xl capitalize text-white">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400 text-sm">/month</span>
                    )}
                  </div>
                  <CardDescription className="text-gray-400">
                    {(plan as any).monthlyCredits} AI designs per month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button
                      className="w-full bg-gray-700 text-gray-300 cursor-default"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-bold ${
                        plan.id === "pro"
                          ? "bg-amber-500 hover:bg-amber-600 text-black"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={loadingPlan === plan.id}
                    >
                      {loadingPlan === plan.id ? (
                        "Redirecting..."
                      ) : (
                        <>
                          Upgrade to {plan.name}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Manage subscription */}
        {user && currentPlan !== "free" && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => createPortal.mutate({ origin: window.location.origin })}
              disabled={createPortal.isPending}
            >
              Manage Subscription
            </Button>
          </div>
        )}

        {/* Ad creatives showcase */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Why tatooo.shop?</h2>
          <p className="text-gray-400 mb-8">Design with AI. Match with verified artists. Get inked.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "AI Design Studio", desc: "Generate unlimited tattoo concepts with professional AI" },
              { title: "Verified Artists", desc: "Browse 500+ verified tattoo artists globally" },
              { title: "15% First Booking", desc: "Artists earn 15% commission on first client booking" },
            ].map((item) => (
              <div key={item.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left">
                <h3 className="font-bold text-amber-400 mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/studio">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 text-lg">
                Start Designing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
