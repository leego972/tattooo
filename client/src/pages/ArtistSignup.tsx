import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  CheckCircle,
  Palette,
  MapPin,
  Instagram,
  Globe,
  Mail,
  User,
  FileText,
  CreditCard,
  Star,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

interface FormData {
  name: string;
  bio: string;
  location: string;
  specialties: string;
  instagram: string;
  website: string;
  contactEmail: string;
  portfolioUrl: string;
}

const STEPS = [
  { id: 1, label: "Your Profile", icon: User },
  { id: 2, label: "Your Work", icon: Palette },
  { id: 3, label: "Annual Fee", icon: CreditCard },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Warm leads only",
    desc: "Clients arrive with a design already created — they just need an artist to bring it to life.",
  },
  {
    icon: Users,
    title: "Global visibility",
    desc: "Get discovered by tattoo enthusiasts worldwide who've designed their perfect tattoo using AI.",
  },
  {
    icon: Zap,
    title: "Instant bookings",
    desc: "Clients can book and pay a deposit directly through your profile — no back-and-forth needed.",
  },
  {
    icon: Shield,
    title: "Verified badge",
    desc: "Earn a verified artist badge after admin review, building trust with potential clients.",
  },
];

export default function ArtistSignup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: "",
    bio: "",
    location: "",
    specialties: "",
    instagram: "",
    website: "",
    contactEmail: "",
    portfolioUrl: "",
  });

  // Check if we're on the success page
  const isSuccess = window.location.pathname.includes("/artist-signup/success");
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id");

  const applyMutation = trpc.artists.applyWithPayment.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to secure payment...");
      window.open(data.checkoutUrl, "_blank");
      // Move to step 3 to show waiting state
      setStep(3);
    },
    onError: (err) => toast.error(err.message || "Failed to submit application."),
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleStep1Next = () => {
    if (!form.name.trim() || !form.contactEmail.trim()) {
      toast.error("Name and contact email are required.");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleSubmit = () => {
    applyMutation.mutate({
      ...form,
      website: form.website || undefined,
      portfolioUrl: form.portfolioUrl || undefined,
      origin: window.location.origin,
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <img src={LOGO_URL} alt="tatt-ooo" className="h-10 mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Application Received!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for joining the tatt-ooo artist directory. Your payment has been processed and
            your application is now <strong className="text-foreground">pending admin review</strong>.
            We'll send a confirmation to your email once approved — usually within 24–48 hours.
          </p>
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Our team reviews your profile (24–48 hrs)</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>You receive a verified badge on your listing</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Clients start discovering and booking you</span>
            </div>
          </div>
          <Button
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            onClick={() => navigate("/artists")}
          >
            View Artist Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="border-b border-border bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-4">
            <img src={LOGO_URL} alt="tatt-ooo" className="h-8 opacity-80" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Join the tatt-ooo Artist Directory
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Connect with clients who've already designed their perfect tattoo using AI — they just
            need <em>you</em> to bring it to life. One annual listing fee, unlimited referrals.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
                Why join?
              </p>
              <div className="space-y-4">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.title}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Annual Listing</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-foreground">$29</span>
                <span className="text-muted-foreground mb-1">/year</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Less than $2.50/month. Cancel anytime — no hidden fees.
              </p>
              <div className="mt-3 space-y-1.5">
                {[
                  "Verified artist badge",
                  "Unlimited client enquiries",
                  "Booking deposit system",
                  "Global directory listing",
                  "Priority in search results",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Multi-step form */}
          <div className="lg:col-span-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      step === s.id
                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                        : step > s.id
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : "bg-muted/20 border border-border/30 text-muted-foreground"
                    )}
                  >
                    {step > s.id ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <s.icon className="w-3 h-3" />
                    )}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-6 h-px", step > s.id ? "bg-green-500/40" : "bg-border/30")} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Basic profile */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Your Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Tell clients who you are and where to find you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" /> Full name / Studio name *
                    </Label>
                    <Input
                      placeholder="e.g. Alex Rivera Tattoo"
                      value={form.name}
                      onChange={set("name")}
                      className="bg-card border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" /> Contact email *
                    </Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={form.contactEmail}
                      onChange={set("contactEmail")}
                      className="bg-card border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Location
                    </Label>
                    <Input
                      placeholder="e.g. London, UK"
                      value={form.location}
                      onChange={set("location")}
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" /> Specialties
                    </Label>
                    <Input
                      placeholder="e.g. Japanese, Blackwork, Realism"
                      value={form.specialties}
                      onChange={set("specialties")}
                      className="bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" /> Bio
                  </Label>
                  <Textarea
                    placeholder="Tell clients about your style, experience, and what makes your work unique..."
                    value={form.bio}
                    onChange={set("bio")}
                    className="bg-card border-border min-h-[100px] resize-none"
                    maxLength={1000}
                  />
                  <p className="text-[10px] text-muted-foreground/60 text-right">
                    {form.bio.length}/1000
                  </p>
                </div>

                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                  onClick={handleStep1Next}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Links & portfolio */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Your Work</h2>
                  <p className="text-sm text-muted-foreground">
                    Help clients find and follow your work online.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram handle
                    </Label>
                    <Input
                      placeholder="@yourstudio"
                      value={form.instagram}
                      onChange={set("instagram")}
                      className="bg-card border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website
                    </Label>
                    <Input
                      placeholder="https://yourstudio.com"
                      value={form.website}
                      onChange={set("website")}
                      className="bg-card border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Portfolio / gallery URL
                  </Label>
                  <Input
                    placeholder="https://instagram.com/yourstudio or https://yourportfolio.com"
                    value={form.portfolioUrl}
                    onChange={set("portfolioUrl")}
                    className="bg-card border-border"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    Link to your best work — Instagram, Behance, personal site, etc.
                  </p>
                </div>

                <div className="bg-card/60 border border-border/40 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Profile preview</p>
                  <p>
                    <strong className="text-foreground">{form.name || "Your Name"}</strong>
                    {form.location && (
                      <span className="ml-2 text-xs">📍 {form.location}</span>
                    )}
                  </p>
                  {form.specialties && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {form.specialties.split(",").map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {form.bio && (
                    <p className="mt-1 text-xs line-clamp-2">{form.bio}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-border/40"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                    onClick={handleStep2Next}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Annual Listing Fee</h2>
                  <p className="text-sm text-muted-foreground">
                    One payment of <strong className="text-foreground">$29/year</strong> to be listed
                    in the tatt-ooo artist directory. Secure checkout via Stripe.
                  </p>
                </div>

                {/* Order summary */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/40">
                    <p className="text-sm font-semibold text-foreground">Order Summary</p>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          tatt-ooo Artist Directory Listing
                        </p>
                        <p className="text-xs text-muted-foreground">Annual subscription</p>
                      </div>
                      <span className="text-sm font-bold text-foreground">$29.00</span>
                    </div>
                    <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <span className="text-lg font-black text-cyan-400">$29.00 / year</span>
                    </div>
                  </div>
                </div>

                {/* Profile summary */}
                <div className="bg-card/60 border border-border/40 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Your listing
                  </p>
                  <p className="text-sm font-bold text-foreground">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.contactEmail}</p>
                  {form.location && (
                    <p className="text-xs text-muted-foreground">📍 {form.location}</p>
                  )}
                  {form.specialties && (
                    <p className="text-xs text-muted-foreground">🎨 {form.specialties}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  Secure payment via Stripe. Your card details are never stored by tatt-ooo.
                </div>

                {applyMutation.isPending ? (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span className="text-sm text-muted-foreground">
                      Preparing your checkout session...
                    </span>
                  </div>
                ) : applyMutation.isSuccess ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-foreground font-semibold">
                      Checkout opened in a new tab
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete your payment there. This page will update once confirmed.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-border/40"
                      onClick={() => setStep(2)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-base py-3"
                      onClick={handleSubmit}
                      disabled={applyMutation.isPending}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay $29 &amp; Join
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/50 text-center">
                  By proceeding you agree to our Terms of Service. Annual fee renews automatically.
                  Cancel anytime from your account settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
