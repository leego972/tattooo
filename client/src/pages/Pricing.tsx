import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check, Zap, Star, Globe, Loader2, Shield, Download, Video, Palette,
  Users, Brush, BadgeCheck, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";

const MEMBER_FEATURES = [
  "Unlimited AI tattoo design generations",
  "All 40+ tattoo styles (Black & Grey, Japanese, Neo-Trad, Geometric, Watercolour & more)",
  "Print-ready 300 DPI files",
  "Body placement preview tool",
  "Drawing board editor",
  "Skin overlay preview",
  "3-variation comparison per design",
  "Animated ink-reveal video",
  "Access to verified global artist directory",
  "Direct booking with artists worldwide",
  "Priority generation queue",
  "Cancel anytime",
];

const ARTIST_FEATURES = [
  "Verified artist profile in global directory",
  "Receive booking requests from members worldwide",
  "Quote tool — send quotes directly to clients",
  "13% platform fee on confirmed bookings only",
  "Multi-session piece support",
  "Portfolio showcase (unlimited images)",
  "SEO-optimised artist page",
  "Weekly feature in tattooo.shop email campaigns",
  "Access to content & marketing tools",
  "Cancel anytime",
];

const HIGHLIGHTS = [
  { icon: Palette, label: "40+ Styles", desc: "Every major tattoo style, AI-trained on real ink" },
  { icon: Download, label: "Print-Ready", desc: "300 DPI PNG files sized to your exact placement" },
  { icon: Video, label: "Animated Reveal", desc: "Cinematic ink-reveal video of your design" },
  { icon: Globe, label: "Global Artists", desc: "Book verified artists in 35+ countries" },
  { icon: Shield, label: "Secure Payments", desc: "All transactions processed via Stripe" },
  { icon: BadgeCheck, label: "Verified Artists", desc: "Every artist is manually reviewed" },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const checkoutMutation = trpc.credits.membershipCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
      toast.success("Redirecting to secure checkout...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const artistCheckoutMutation = trpc.credits.membershipCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
      toast.success("Redirecting to artist checkout...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const handleMemberCheckout = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    checkoutMutation.mutate({ interval: billingCycle, origin: window.location.origin });
  };

  const handleArtistCheckout = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    artistCheckoutMutation.mutate({ interval: "yearly", origin: window.location.origin });
  };

  const monthlyPrice = billingCycle === "yearly" ? "$8.25" : "$10";
  const yearlyTotal = billingCycle === "yearly" ? "$99/yr" : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background glows */}
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
            One Membership. Everything Included.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Unlimited AI designs, global artist access, and direct booking — all for less than a coffee a week.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-1 gap-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-cyan-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-cyan-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yearly
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                billingCycle === "yearly" ? "bg-black/20 text-black" : "bg-amber-500/20 text-amber-400"
              }`}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Two-column pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Member Card */}
          <div className="relative bg-gradient-to-b from-cyan-950/30 to-zinc-900/60 border-2 border-cyan-500 rounded-2xl p-7 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-full">
              For Tattoo Enthusiasts
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Member</div>
                <div className="text-zinc-400 text-xs">Full platform access</div>
              </div>
            </div>

            <div className="mb-1">
              <span className="text-4xl font-black text-white">{monthlyPrice}</span>
              <span className="text-zinc-400 text-sm ml-1">/mo</span>
              {yearlyTotal && (
                <span className="ml-2 text-zinc-500 text-sm">({yearlyTotal} billed annually)</span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mb-6">Cancel anytime. No lock-in.</p>

            <ul className="space-y-2.5 mb-8 flex-1">
              {MEMBER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleMemberCheckout}
              disabled={checkoutMutation.isPending}
              className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base"
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Artist Card */}
          <div className="relative bg-gradient-to-b from-amber-950/20 to-zinc-900/60 border-2 border-amber-500/60 rounded-2xl p-7 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">
              For Tattoo Artists & Studios
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Brush className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Artist Listing</div>
                <div className="text-zinc-400 text-xs">Global directory + booking</div>
              </div>
            </div>

            <div className="mb-1">
              <span className="text-4xl font-black text-white">$99</span>
              <span className="text-zinc-400 text-sm ml-1">/yr</span>
            </div>
            <p className="text-zinc-500 text-xs mb-6">+ 13% platform fee on confirmed bookings only. No upfront risk.</p>

            <ul className="space-y-2.5 mb-8 flex-1">
              {ARTIST_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleArtistCheckout}
              disabled={artistCheckoutMutation.isPending}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base"
            >
              {artistCheckoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Join as Artist
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
              <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="font-semibold text-white text-sm mb-1">{label}</div>
              <div className="text-zinc-500 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        {/* FAQ strip */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-white text-lg mb-4">Common Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "What happens after I subscribe?",
                a: "Instant access to the full Studio — generate unlimited designs, browse the artist directory, and book directly.",
              },
              {
                q: "How does the 13% booking fee work?",
                a: "When an artist sends you a quote and you confirm, you pay the artist's quote plus a 13% platform fee. That's our only charge — no hidden costs.",
              },
              {
                q: "What about multi-session tattoos?",
                a: "The platform fee is charged once on the full quote. All follow-up sessions are booked directly with your artist in person.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes — cancel your membership from your account settings at any time. No questions asked.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <div className="font-semibold text-white text-sm mb-1">{q}</div>
                <div className="text-zinc-400 text-sm leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs">
          Secure payments via Stripe. Memberships activate instantly. No hidden fees.{" "}
          <a href="/terms" className="text-zinc-500 hover:text-zinc-400 underline">Terms & Conditions</a>
        </p>
      </div>
    </div>
  );
}
