import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Crown, Settings, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Subscription() {
  const { user } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const { data: plans } = trpc.subscription.getPlans.useQuery();
  const { data: status } = trpc.subscription.getStatus.useQuery(undefined, { enabled: !!user });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
      setLoading(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setLoading(false);
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

  const isMember = status?.plan === "member";
  const features: string[] = (plans?.features as string[]) ?? [];

  const handleUpgrade = () => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    setLoading(true);
    createCheckout.mutate({ interval, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
            tattooo.shop Membership
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            One Plan. Everything Included.
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Full access to AI tattoo design, the global artist directory, and booking — all for less than a coffee a week.
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-full p-1">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              interval === "monthly" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              interval === "yearly" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Yearly
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Card */}
      <div className="max-w-md mx-auto px-4 pb-20">
        <Card className="border-amber-500/50 bg-amber-900/10 ring-2 ring-amber-500/30 relative overflow-hidden">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-amber-500 text-black font-bold px-4">
              <Crown className="w-3 h-3 mr-1 inline" />
              Full Member
            </Badge>
          </div>

          <CardHeader className="pt-8 text-center">
            <CardTitle className="text-2xl text-white">tattooo.shop Member</CardTitle>
            <CardDescription className="text-gray-400">
              Everything you need to design and book your perfect tattoo
            </CardDescription>
            <div className="mt-4">
              <span className="text-5xl font-black text-amber-400">
                {interval === "monthly" ? "$10" : "$99"}
              </span>
              <span className="text-gray-400 ml-1">/{interval === "monthly" ? "month" : "year"}</span>
              {interval === "yearly" && (
                <p className="text-sm text-green-400 mt-1">That's just $8.25/month — save $21</p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {features.length > 0 ? features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  {feature}
                </li>
              )) : [
                "Unlimited AI tattoo designs",
                "Body placement preview",
                "Browse verified global artists",
                "Direct artist messaging",
                "Booking with secure deposit",
                "Design history & gallery",
                "Priority support",
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isMember ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-2 py-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">You're a Member</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-gray-600"
                  onClick={() => createPortal.mutate({ origin: window.location.origin })}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg py-6 mt-2"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? "Redirecting..." : `Get Full Access — ${interval === "monthly" ? "$10/mo" : "$99/yr"}`}
              </Button>
            )}

            {!isMember && (
              <p className="text-xs text-gray-500 text-center">
                Cancel anytime. Secure checkout via Stripe.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-300">Free tier available</p>
              <p className="text-xs text-gray-500 mt-1">
                Browse artists and generate limited designs for free. Upgrade to unlock unlimited access and booking.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/studio">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Try the designer first <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
