import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brush, Check, ArrowRight, Globe, Users, Shield, Star, BadgeCheck,
  Zap, TrendingUp, Camera, Clock, Loader2, Palette, DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/assets/tattooo-logo.png";

const ARTIST_FEATURES = [
  "Verified artist profile in global directory",
  "Receive booking requests from members worldwide",
  "AI-prepared design briefs from every client",
  "Integrated quote & booking management",
  "SEO-optimised artist page",
  "Weekly feature in tattooo.shop email campaigns",
  "Access to content & marketing tools",
  "Cancel anytime",
];

const ARTIST_PERKS = [
  { icon: Globe, title: "Global Reach", desc: "Get discovered by clients from 38+ countries — not just your local area." },
  { icon: TrendingUp, title: "Steady Bookings", desc: "Quotes, bookings, and payments all handled on-platform. Less admin, more tattooing." },
  { icon: Shield, title: "Verified Badge", desc: "Stand out with a verified artist badge. Build trust before clients even message you." },
  { icon: Camera, title: "Portfolio Showcase", desc: "Upload your best work. Let your art speak for itself to a global audience." },
  { icon: Clock, title: "You Control Your Schedule", desc: "Set your availability. Multi-session pieces? Book the first session, manage the rest in person." },
  { icon: Star, title: "Reviews & Reputation", desc: "Earn 5-star reviews that follow you. Build a reputation that transcends your city." },
];

const STATS = [
  { value: "2,400+", label: "Active Members", icon: Users },
  { value: "38", label: "Countries", icon: Globe },
  { value: "340+", label: "Artists Listed", icon: Brush },
  { value: "13%", label: "Commission Only on Confirmed Bookings", icon: DollarSign },
];

export default function ArtistRegister() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const checkoutMutation = trpc.credits.membershipCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
      toast.success("Redirecting to secure checkout...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const handleArtistCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login, then come back here
      window.location.href = getLoginUrl() + "?returnTo=/artist-register";
      return;
    }
    checkoutMutation.mutate({ interval: "yearly", origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Minimal nav header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={LOGO_URL} alt="tatt-ooo" className="h-8 w-8 rounded-full object-cover ring-1 ring-amber-500/30" />
            <span className="font-bold text-white text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>tatt-ooo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs h-8">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-8">
                Sign Up as Client
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-5">
            <Brush className="w-3.5 h-3.5" />
            For Tattoo Artists &amp; Studios
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Fill Your Studio with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Ready-to-Book Clients
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            We handle the marketing, client acquisition, and design preparation.
            You focus on the tattoo. No upfront risk — just a simple 13% commission on confirmed bookings.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Pricing card — artist only */}
        <div className="max-w-md mx-auto mb-16">
          <div className="relative bg-gradient-to-b from-amber-950/30 to-zinc-900/60 border-2 border-amber-500 rounded-2xl p-8 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
              Artist &amp; Studio Listing
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Brush className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-white text-xl">Artist Listing</div>
                <div className="text-zinc-400 text-sm">Global directory + booking</div>
              </div>
            </div>
            <div className="mb-1">
              <span className="text-5xl font-black text-white">$99</span>
              <span className="text-zinc-400 text-sm ml-2">/yr</span>
            </div>
            <p className="text-zinc-500 text-sm mb-7">
              + 13% platform fee on confirmed bookings only. No upfront risk.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {ARTIST_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleArtistCheckout}
              disabled={checkoutMutation.isPending}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base mb-3"
            >
              {checkoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Join as Artist — $99/yr
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-zinc-600">
              Already have an account?{" "}
              <Link href="/artist-signup" className="text-amber-400 hover:underline">
                Complete your artist profile
              </Link>
            </p>
          </div>
        </div>

        {/* Why join section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Artists Choose tatt-ooo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARTIST_PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.title} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{perk.title}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">{perk.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", icon: Palette, title: "Create Your Profile", desc: "Upload your portfolio, set your styles, location, and availability. Takes under 10 minutes." },
              { num: "02", icon: Zap, title: "Receive Booking Requests", desc: "Clients find you, generate AI design briefs, and send you booking requests with full context." },
              { num: "03", icon: DollarSign, title: "Confirm & Earn", desc: "Accept the booking, confirm the session, and get paid. 13% platform fee only on confirmed jobs." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-xs text-amber-400 font-bold mb-1">{step.num}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-amber-950/30 to-zinc-900/60 border border-amber-500/30 rounded-2xl p-10">
          <BadgeCheck className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Reach Clients Worldwide?</h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Join 340+ verified artists already earning through tattooo.shop. No monthly fees, no upfront risk.
          </p>
          <Button
            onClick={handleArtistCheckout}
            disabled={checkoutMutation.isPending}
            className="h-12 px-8 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Get Listed — $99/yr
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-zinc-600 mt-3">
            Looking for a client account?{" "}
            <Link href="/signup" className="text-cyan-400 hover:underline">Sign up as a member instead</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
