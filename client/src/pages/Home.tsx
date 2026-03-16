import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ChevronRight, Zap, Palette, Download, UserPlus,
  Globe, Star, TrendingUp, Users, MapPin, Shield, Clock,
  CheckCircle, ArrowRight, Instagram, Brush, Camera, CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useRef, useEffect } from "react";

const LOGO_URL = "/assets/tattooo-logo.png";
const LEEGO_URL = "/assets/leego-logo.png";

// Leego logo with click-to-enlarge animation (2× for 3 seconds)
function LeegoLogo({ size = 48 }: { size?: number }) {
  const [enlarged, setEnlarged] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClick = () => {
    setEnlarged(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setEnlarged(false), 3000);
  };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (
    <img
      src={LEEGO_URL}
      alt="Created by LEEGO"
      onClick={handleClick}
      style={{
        width: enlarged ? size * 2 : size,
        height: enlarged ? size * 2 : size,
        transition: "width 0.3s ease, height 0.3s ease",
        cursor: "pointer",
        objectFit: "contain",
        opacity: enlarged ? 1 : 0.85,
      }}
    />
  );
}
const WALLPAPER_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/hero-wallpaper_ca0e6f21.png";
const GLOBAL_BANNER_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-global-banner-Xs7FLXjLMHnPoDUL7epTa5.webp";

const AD_CREATIVES = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-hero-instagram-2utpP9zmqGGonqAqypdMSJ.webp",
    label: "Client Ad — Instagram",
    aspect: "4 / 5",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-artist-recruitment-JDdieWoQc3SY6TmQYcqhxf.webp",
    label: "Artist Recruitment Ad",
    aspect: "4 / 5",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-ai-design-feature-hBL6TJTacAvk2YZh9v8PA9.webp",
    label: "AI Feature Ad",
    aspect: "4 / 5",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-membership-promo-jAR8YGtEEkAeuPmKbXbc2z.webp",
    label: "Membership Promo",
    aspect: "1 / 1",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-styles-showcase-D7rzLUaJapaUxRScTcP3Dn.webp",
    label: "Styles Showcase",
    aspect: "4 / 5",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-affiliate-referral-Yw8Bh8Ka4WRJ9GbFZjWbiV.webp",
    label: "Affiliate Programme Ad",
    aspect: "4 / 5",
  },
];

const STATS = [
  { value: "2,400+", label: "Members Worldwide", icon: Users },
  { value: "38", label: "Countries Active", icon: Globe },
  { value: "14,000+", label: "Designs Generated", icon: Sparkles },
  { value: "340+", label: "Artists & Studios", icon: Brush },
];

const COUNTRIES = [
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇺🇸", name: "USA" },
  { flag: "🇬🇧", name: "UK" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇿🇦", name: "South Africa" },
];

const CLIENT_STEPS = [
  {
    num: "01",
    icon: Sparkles,
    title: "Describe Your Vision",
    desc: "Type what you want — style, placement, mood, references. Our AI refines your idea into a professional tattoo prompt.",
  },
  {
    num: "02",
    icon: Zap,
    title: "Generate Your Design",
    desc: "Studio-quality AI artwork generated in seconds. Iterate until it's exactly right. Download high-res for your artist.",
  },
  {
    num: "03",
    icon: Users,
    title: "Find Your Artist",
    desc: "Browse 340+ verified artists globally. Filter by style, location, and availability. Message them directly.",
  },
  {
    num: "04",
    icon: CreditCard,
    title: "Book & Pay Securely",
    desc: "Accept your artist's quote. Pay the 13% platform fee via Stripe. First session confirmed — the rest is between you and your artist.",
  },
];

const ARTIST_PERKS = [
  { icon: Globe, title: "Global Reach", desc: "Get discovered by clients from 38+ countries — not just your local area." },
  { icon: TrendingUp, title: "Steady Income", desc: "Quotes, bookings, and payments all handled on-platform. Less admin, more tattooing." },
  { icon: Shield, title: "Verified Profile", desc: "Stand out with a verified artist badge. Build trust before clients even message you." },
  { icon: Camera, title: "Portfolio Showcase", desc: "Upload your best work. Let your art speak for itself to a global audience." },
  { icon: Clock, title: "You Control Your Schedule", desc: "Set your availability. Multi-session pieces? Book the first session, manage the rest in person." },
  { icon: Star, title: "Reviews & Reputation", desc: "Earn 5-star reviews that follow you. Build a reputation that transcends your city." },
];

const TESTIMONIALS = [
  {
    name: "Jake M.",
    location: "Sydney, Australia",
    text: "I described a full sleeve concept and had a design to show my artist within 5 minutes. Saved hours of back-and-forth. Absolutely game-changing.",
    stars: 5,
  },
  {
    name: "Priya S.",
    location: "London, UK",
    text: "Found an artist in Berlin through tattooo.shop for my trip. The booking was seamless and the design I generated was exactly what I wanted.",
    stars: 5,
  },
  {
    name: "Carlos R.",
    location: "São Paulo, Brazil",
    text: "As an artist, I've had clients from Australia, Germany, and the US book me through this platform. The global reach is real.",
    stars: 5,
  },
];

const STYLES = [
  "Black & Grey Realism", "Neo-Traditional", "Geometric", "Watercolor",
  "Japanese", "Tribal", "Fine Line", "Biomechanical", "Blackwork", "Illustrative",
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col bg-[#0a0a0a] text-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-6">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Tattoo Platform — Est. 2026</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
              YOUR TATTOO.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                YOUR VISION.
              </span>
              <br />
              WORLDWIDE.
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
              AI-powered tattoo design meets a global network of verified artists. 
              Generate your perfect design, find the right artist anywhere on the planet, 
              and book securely — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              {isAuthenticated ? (
                <Link href="/studio">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold text-base px-8 gap-2 h-12">
                    <Sparkles className="w-5 h-5" />
                    Generate Your Design
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold text-base px-8 gap-2 h-12">
                      <Sparkles className="w-5 h-5" />
                      Start Free
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </a>
                  <Link href="/artists">
                    <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base px-8 h-12 gap-2">
                      <Users className="w-5 h-5" />
                      Browse Artists
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Free to generate designs
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Verified artists only
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── GLOBAL STATS ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-3">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GLOBAL REACH ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
              <Globe className="w-3.5 h-3.5" />
              GLOBAL COMMUNITY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Tattoo culture knows
              <span className="text-amber-400"> no borders.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Members and artists from 38 countries and counting. Whether you're in Tokyo, Toronto, or Cape Town — 
              your perfect artist is on tattooo.shop.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {COUNTRIES.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/5 transition-colors">
                <span className="text-2xl">{c.flag}</span>
                <span className="text-xs text-gray-400">{c.name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-2xl">🌍</span>
              <span className="text-xs text-amber-400 font-medium">+26 more</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (CLIENT) ─────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
              FOR CLIENTS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              From idea to ink.
              <span className="text-amber-400"> Four steps.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              The easiest way to get the tattoo you actually want, with an artist you actually trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CLIENT_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative">
                  {i < CLIENT_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(100%+0px)] w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent z-0" style={{ width: 'calc(100% - 2rem)', left: 'calc(100% + 1rem)' }} />
                  )}
                  <div className="relative p-6 rounded-2xl bg-white/3 border border-white/5 hover:border-amber-500/20 transition-colors">
                    <div className="text-5xl font-black text-white/5 absolute top-4 right-4 leading-none">{step.num}</div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            {isAuthenticated ? (
              <Link href="/studio">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate Your Design Now
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Free — No Card Required
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── TATTOO STYLES ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">Every style. Every vision.</h2>
            <p className="text-gray-400 text-sm">Our AI understands the full spectrum of tattoo artistry.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {STYLES.map((style) => (
              <span key={style} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-amber-500/30 hover:text-amber-400 transition-colors cursor-default">
                {style}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTIST SECTION ────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
                FOR ARTISTS & STUDIOS
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                Stop relying on Instagram.
                <br />
                <span className="text-amber-400">Go global.</span>
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                tattooo.shop is the first platform built specifically for tattoo artists to reach an international 
                client base. 2,400+ members are actively looking for artists like you — right now.
              </p>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                List your studio, showcase your portfolio, receive quote requests, and get paid — all without 
                the algorithm games. We handle the platform fee (13% of each booking) so you keep the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/artist-signup">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2">
                    <UserPlus className="w-5 h-5" />
                    List Your Studio
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/artists">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                    <Users className="w-5 h-5" />
                    See Artist Profiles
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ARTIST_PERKS.map((perk) => {
                const Icon = perk.icon;
                return (
                  <div key={perk.title} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-purple-500/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-white mb-1">{perk.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{perk.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Real people.
              <span className="text-amber-400"> Real ink.</span>
            </h2>
            <p className="text-gray-400">From our growing global community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white/3 border border-white/5">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {t.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ───────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
            <TrendingUp className="w-3.5 h-3.5" />
            SIMPLE PRICING
          </div>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            One membership.
            <span className="text-amber-400"> Unlimited designs.</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            $10/month or $99/year. Unlimited AI generations, full artist directory access, 
            and secure booking — all included. No hidden fees, no credit packs.
          </p>

          <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 mb-8">
            <div className="text-5xl font-black text-white mb-1">$10<span className="text-2xl text-gray-400 font-normal">/mo</span></div>
            <div className="text-gray-400 text-sm mb-6">or $99/year — save $21</div>
            <ul className="text-left space-y-2 mb-6">
              {[
                "Unlimited AI tattoo designs",
                "Full artist & studio directory",
                "Direct artist messaging",
                "Secure booking & payments",
                "Design history & downloads",
                "Priority support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <Link href="/subscription">
                <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold">
                  Get Membership
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold">
                  Start Free Today
                </Button>
              </a>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Cancel anytime. No lock-in contracts. Payments secured by Stripe.
          </p>
        </div>
      </section>

      {/* ── GLOBAL BANNER ─────────────────────────────────────────── */}
      <section className="border-t border-white/5 overflow-hidden">
        <img
          src={GLOBAL_BANNER_URL}
          alt="The World's Tattoo Platform — 38 Countries, 340+ Artists, One Platform"
          className="w-full object-cover max-h-[300px]"
        />
      </section>

      {/* ── AD CREATIVES SHOWCASE ─────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-4">
              <Instagram className="w-3.5 h-3.5" />
              <span>Share the Movement</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              SPREAD THE WORD.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"> GET REWARDED.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Download our ad creatives and share them on your socials. Every referral earns you commission 
              through our affiliate programme — artists and clients both count.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AD_CREATIVES.map((ad) => (
              <div key={ad.label} className="group relative overflow-hidden rounded-xl border border-white/10 hover:border-amber-500/40 transition-all duration-300">
                <img
                  src={ad.url}
                  alt={ad.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ aspectRatio: ad.aspect }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div>
                    <p className="text-white font-bold text-sm">{ad.label}</p>
                    <a
                      href={ad.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1 mt-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/referral">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold gap-2">
                <TrendingUp className="w-5 h-5" />
                Join the Affiliate Programme
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={LOGO_URL} alt="tattooo.shop" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-black text-lg">tattooo.shop</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                The global tattoo platform. AI design meets verified artists worldwide. Est. 2026.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/studio" className="hover:text-amber-400 transition-colors">AI Studio</Link></li>
                <li><Link href="/artists" className="hover:text-amber-400 transition-colors">Find Artists</Link></li>
                <li><Link href="/pricing" className="hover:text-amber-400 transition-colors">Pricing</Link></li>
                <li><Link href="/subscription" className="hover:text-amber-400 transition-colors">Membership</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white mb-3">Artists</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/artist-signup" className="hover:text-amber-400 transition-colors">List Your Studio</Link></li>
                <li><Link href="/artist-dashboard" className="hover:text-amber-400 transition-colors">Artist Dashboard</Link></li>
                <li><Link href="/referral" className="hover:text-amber-400 transition-colors">Affiliate Programme</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms & Conditions</Link></li>
                <li><a href="mailto:legal@tattooo.shop" className="hover:text-amber-400 transition-colors">legal@tattooo.shop</a></li>
                <li><a href="mailto:support@tattooo.shop" className="hover:text-amber-400 transition-colors">support@tattooo.shop</a></li>
              </ul>
            </div>
          </div>
          {/* How to reach our team */}
          <div className="border-t border-white/5 pt-6 pb-4 mb-2">
            <h4 className="font-semibold text-sm text-white mb-1">How to reach our team</h4>
            <p className="text-xs text-gray-500 mb-1">For partnership enquiries, studio onboarding, and general questions:</p>
            <a href="mailto:tattoooaistudio@gmail.com" className="text-amber-400 hover:underline text-sm font-medium">tattoooaistudio@gmail.com</a>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">© 2026 tattooo.shop. All rights reserved. Payments secured by Stripe.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 38 countries</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 2,400+ members</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Verified artists</span>
            </div>
          </div>
          {/* Created by LEEGO */}
          <div className="flex flex-col items-center pt-6 border-t border-white/5 mt-2">
            <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Created by</p>
            <div className="bg-black rounded-xl p-2 shadow-lg shadow-black/60 inline-flex items-center justify-center">
              <LeegoLogo size={56} />
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
