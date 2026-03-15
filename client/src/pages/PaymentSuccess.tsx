import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Crown, Star, Palette, Calendar } from "lucide-react";

const PLAN_CREDITS: Record<string, number> = { pro: 50, studio: 200 };
const PACK_CREDITS: Record<string, number> = { starter: 50, pro: 150, unlimited: 500 };

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type") || "credits";
  const plan = params.get("plan") || "";
  const pack = params.get("pack") || "";
  const utils = trpc.useUtils();

  useEffect(() => {
    utils.credits.balance.invalidate();
    utils.subscription.getStatus.invalidate();
  }, [utils]);

  // ── Subscription upgrade ──────────────────────────────────────────────────
  if (type === "subscription") {
    const creditsAdded = PLAN_CREDITS[plan] ?? 50;
    const isStudio = plan === "studio";
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 ${isStudio ? "bg-purple-500/10 border-purple-500/30" : "bg-amber-500/10 border-amber-500/30"} border rounded-full flex items-center justify-center mx-auto mb-6`}>
            {isStudio ? <Crown className="w-10 h-10 text-purple-400" /> : <Star className="w-10 h-10 text-amber-400" />}
          </div>
          <Badge className={`mb-4 ${isStudio ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
            {isStudio ? "Studio Plan" : "Pro Plan"} Activated
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-3">Welcome to {isStudio ? "Studio" : "Pro"}!</h1>
          <p className="text-zinc-400 mb-2">
            <span className="text-white font-semibold">{creditsAdded} credits</span> have been added to your account.
          </p>
          <p className="text-zinc-500 text-sm mb-8">Your plan renews monthly — {creditsAdded} new credits every billing cycle.</p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-8 text-left space-y-2">
            <p className="text-zinc-400 text-sm font-medium">What's unlocked:</p>
            {isStudio ? (
              <ul className="text-zinc-300 text-sm space-y-1">
                <li>✓ 200 AI designs/month</li><li>✓ Bulk generation</li>
                <li>✓ Commercial license</li><li>✓ White-label exports</li>
                <li>✓ Artist collaboration tools</li>
              </ul>
            ) : (
              <ul className="text-zinc-300 text-sm space-y-1">
                <li>✓ 50 AI designs/month</li><li>✓ All 40+ styles & variations</li>
                <li>✓ 3-way comparison view</li><li>✓ Skin overlay preview</li>
                <li>✓ Animated reveal video</li>
              </ul>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/studio")} className={`${isStudio ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-500 hover:bg-amber-600 text-black"} font-semibold`}>
              <Sparkles className="w-4 h-4 mr-2" />Start Designing
            </Button>
            <Button onClick={() => navigate("/subscription")} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              View Plan Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Artist registration ───────────────────────────────────────────────────
  if (type === "artist") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Palette className="w-10 h-10 text-cyan-400" />
          </div>
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Application Received</Badge>
          <h1 className="text-3xl font-bold text-white mb-3">You're on the list!</h1>
          <p className="text-zinc-400 mb-8">Your artist directory listing is being reviewed. We'll email you within 24–48 hours once your profile is live.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/artists")} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">Browse Artists</Button>
            <Button onClick={() => navigate("/")} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking deposit ───────────────────────────────────────────────────────
  if (type === "booking") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-green-400" />
          </div>
          <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/30">Booking Confirmed</Badge>
          <h1 className="text-3xl font-bold text-white mb-3">Appointment Secured!</h1>
          <p className="text-zinc-400 mb-8">Your deposit has been received and your appointment is confirmed. The artist will be in touch shortly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/bookings")} className="bg-green-600 hover:bg-green-700 text-white font-semibold">View My Bookings</Button>
            <Button onClick={() => navigate("/studio")} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Back to Studio</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Credit pack purchase (default) ────────────────────────────────────────
  const creditsAdded = PACK_CREDITS[pack] ?? 50;
  const packLabel = pack === "starter" ? "Starter Pack" : pack === "pro" ? "Pro Pack" : pack === "unlimited" ? "Unlimited" : "Credit Pack";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/30">{packLabel} Purchased</Badge>
        <h1 className="text-3xl font-bold text-white mb-3">Payment Successful!</h1>
        <p className="text-zinc-400 mb-2">
          <span className="text-white font-semibold">{creditsAdded} credits</span> have been added to your account.
        </p>
        <p className="text-zinc-500 text-sm mb-8">Each AI tattoo design costs 1 credit. Video reveals cost 5 credits.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/studio")} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
            <Sparkles className="w-4 h-4 mr-2" />Start Designing
          </Button>
          <Button onClick={() => navigate("/my-tatts")} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            View My Tatts
          </Button>
        </div>
      </div>
    </div>
  );
}
