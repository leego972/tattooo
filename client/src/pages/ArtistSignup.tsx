import { useState } from "react";
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
  CreditCard,
  Star,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Phone,
  Clock,
  Camera,
  DollarSign,
  Languages,
  Briefcase,
  Building2,
  Percent,
  Megaphone,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const COUNTRIES = [
  "Australia", "United Kingdom", "United States", "Canada", "New Zealand",
  "Germany", "France", "Spain", "Italy", "Netherlands", "Sweden", "Norway", "Denmark",
  "Japan", "South Korea", "Brazil", "Mexico", "Argentina", "South Africa",
  "India", "Singapore", "Thailand", "Indonesia", "Philippines", "Other",
];

type HoursEntry = { open: string; close: string; closed: boolean };
type BusinessHours = Record<string, HoursEntry>;

const DEFAULT_HOURS: BusinessHours = {
  Monday:    { open: "09:00", close: "17:00", closed: false },
  Tuesday:   { open: "09:00", close: "17:00", closed: false },
  Wednesday: { open: "09:00", close: "17:00", closed: false },
  Thursday:  { open: "09:00", close: "17:00", closed: false },
  Friday:    { open: "09:00", close: "17:00", closed: false },
  Saturday:  { open: "10:00", close: "15:00", closed: false },
  Sunday:    { open: "10:00", close: "15:00", closed: true  },
};

interface FormData {
  name: string;
  contactEmail: string;
  phone: string;
  bio: string;
  specialties: string;
  yearsExperience: string;
  priceRange: string;
  languages: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  website: string;
  profilePhotoUrl: string;
  portfolioImages: string;
  hourlyRate: string;
  depositAmount: string;
  businessHours: BusinessHours;
  isTeamSignup: boolean;
  studioName: string;
  studioDescription: string;
}

const STEPS = [
  { id: 1, label: "Profile",    icon: User },
  { id: 2, label: "Location",   icon: MapPin },
  { id: 3, label: "Portfolio",  icon: Camera },
  { id: 4, label: "Hours",      icon: Clock },
  { id: 5, label: "Payment",    icon: CreditCard },
];

const HOW_IT_WORKS = [
  {
    icon: Megaphone,
    step: "01",
    title: "We drive the traffic",
    desc: "tatt-ooo runs targeted marketing campaigns across social media and search to attract tattoo enthusiasts globally. We bring the audience — you don't spend a cent on advertising.",
  },
  {
    icon: FileText,
    step: "02",
    title: "Clients design their tattoo with AI",
    desc: "Every client uses our AI design tools to create a detailed, to-scale brief of exactly what they want — style, size, placement, and reference imagery — before they ever contact a studio.",
  },
  {
    icon: Users,
    step: "03",
    title: "We match them to your studio",
    desc: "Based on location, style, and availability, we connect the client directly to your listing. They arrive informed, prepared, and ready to book — no vague consultations, no wasted time.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "You quote, they confirm",
    desc: "You review the AI-prepared brief and send your quote through the platform. The client selects a date and time from your available slots, then pays tatt-ooo a 13% booking fee online to lock in the appointment. The booking is now guaranteed.",
  },
  {
    icon: Percent,
    step: "05",
    title: "Client arrives, you get paid in full",
    desc: "On the day, the client comes to your studio with their printable to-scale design file ready to go. They pay you directly for the full quoted job. tatt-ooo earns only the 13% booking fee paid online at confirmation — you keep every cent of your quote.",
  },
];

const BENEFITS = [
  { icon: TrendingUp, title: "Pre-qualified clients only",    desc: "Clients arrive with a complete AI-generated design brief — they know what they want, at what scale, and where. No guesswork." },
  { icon: Users,      title: "Global reach",                  desc: "Get discovered by tattoo enthusiasts worldwide who have already designed their perfect tattoo using our AI tools." },
  { icon: Zap,        title: "Keep 100% of your quoted rate",    desc: "Clients pay tatt-ooo a 13% booking fee online to secure their appointment. On the day, they pay you directly for the full job. Your only cost is your membership fee — nothing more." },
  { icon: Shield,     title: "Verified studio badge",         desc: "Earn a verified badge after admin review, building trust and credibility with clients browsing the directory." },
];

function HowItWorksSection() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-cyan-500/20 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          How the Partnership Works — Full Breakdown
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-5 py-5 space-y-5 border-t border-cyan-500/20 bg-background/50">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">Step {item.step}</span>
                  <span className="text-sm font-bold text-foreground">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-xs font-semibold text-amber-400 mb-1">Commission Summary</p>
            <p className="text-xs text-muted-foreground">
              Your studio pays a <strong className="text-foreground">membership fee</strong> at signup (Solo Artist: $29/year · Studio Team: $49/month or $479/year).
              When a client confirms a booking, they pay tatt-ooo a <strong className="text-foreground">13% booking fee</strong> online to secure the appointment — this is charged to the client, not your studio.
              On the day, the client pays you directly for the full quoted job. You keep 100% of your rate.
              You must respond to booking requests within 24 hours or the request is automatically cancelled.
              By registering, you agree to these terms as outlined in the <a href="/terms" className="text-cyan-400 underline underline-offset-2">tatt-ooo Terms of Service</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtistSignup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", contactEmail: "", phone: "", bio: "",
    specialties: "", yearsExperience: "", priceRange: "", languages: "",
    address: "", city: "", state: "", country: "", postcode: "",
    instagram: "", tiktok: "", facebook: "", website: "",
    profilePhotoUrl: "", portfolioImages: "",
    hourlyRate: "", depositAmount: "50",
    businessHours: DEFAULT_HOURS,
    isTeamSignup: false, studioName: "", studioDescription: "",
  });

  const isSuccess = window.location.pathname.includes("/artist-signup/success");

  const applyMutation = trpc.artists.applyWithPaymentFull.useMutation({
    onSuccess: (data) => {
      toast.success("Redirecting to secure payment...");
      window.open(data.checkoutUrl, "_blank");
    },
    onError: (err) => toast.error(err.message || "Failed to submit application."),
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const setHours = (day: string, field: keyof HoursEntry, value: string | boolean) => {
    setForm((f) => ({
      ...f,
      businessHours: {
        ...f.businessHours,
        [day]: { ...f.businessHours[day], [field]: value },
      },
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim() || !form.contactEmail.trim()) {
        toast.error("Name and contact email are required.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleSubmit = () => {
    if (!agreedToTerms) {
      toast.error("Please read and agree to the Terms of Service and commission structure before proceeding.");
      return;
    }

    const portfolioImages = form.portfolioImages
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    applyMutation.mutate({
      name: form.name,
      bio: form.bio || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      postcode: form.postcode || undefined,
      specialties: form.specialties || undefined,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
      priceRange: form.priceRange || undefined,
      languages: form.languages || undefined,
      instagram: form.instagram || undefined,
      tiktok: form.tiktok || undefined,
      facebook: form.facebook || undefined,
      website: form.website || undefined,
      contactEmail: form.contactEmail,
      hourlyRate: form.hourlyRate ? parseInt(form.hourlyRate) : undefined,
      depositAmount: parseInt(form.depositAmount) || 50,
      businessHours: form.businessHours,
      profilePhotoUrl: form.profilePhotoUrl || undefined,
      portfolioImages: portfolioImages.length > 0 ? portfolioImages : undefined,
      isTeamSignup: form.isTeamSignup,
      studioName: form.isTeamSignup ? form.studioName : undefined,
      studioDescription: form.isTeamSignup ? form.studioDescription : undefined,
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
            Thank you for joining the tatt-ooo partner network. Your application is now{" "}
            <strong className="text-foreground">pending admin review</strong>. We'll send a confirmation
            to your email once approved — usually within 24–48 hours.
          </p>
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
            {[
              "Our team reviews your profile (24–48 hrs)",
              "You receive a verified badge on your listing",
              "Clients start discovering and booking you",
              "You receive booking enquiries with AI-prepared design briefs",
              "Confirm bookings and earn — 13% commission applies only on confirmed jobs",
            ].map((t) => (
              <div key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={() => navigate("/artists")}>
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
            Partner with tatt-ooo — Fill Your Studio with Ready-to-Book Clients
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            We handle the marketing, client acquisition, and design preparation. You focus on the tattoo.
            No upfront costs. No subscriptions. A simple <strong className="text-foreground">13% commission</strong> only when a booking is confirmed.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Benefits + How It Works */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Why partner with us?</p>
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

            {/* Commission card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Commission Model</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black text-foreground">13%</span>
                <span className="text-muted-foreground mb-1">/ confirmed booking</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Charged on the quoted job value only when a booking is confirmed. Zero cost if no booking is made.
              </p>
              <div className="space-y-1.5">
                {[
                  "No upfront listing fee",
                  "No monthly subscription",
                  "No charge for unconfirmed enquiries",
                  "Automatic deduction from client deposit",
                  "Full booking management included",
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
          <div className="lg:col-span-2 space-y-6">
            {/* How It Works expandable — shown above the form */}
            <HowItWorksSection />

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    step === s.id ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                    : step > s.id ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-muted/20 border border-border/30 text-muted-foreground"
                  )}>
                    {step > s.id ? <CheckCircle className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-4 h-px", step > s.id ? "bg-green-500/40" : "bg-border/30")} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 1: Profile ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Your Profile</h2>
                  <p className="text-sm text-muted-foreground">Tell clients who you are and what you do.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" /> Full name / Studio name *
                    </Label>
                    <Input placeholder="e.g. Alex Rivera Tattoo" value={form.name} onChange={set("name")} className="bg-card border-border" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" /> Contact email *
                    </Label>
                    <Input type="email" placeholder="your@email.com" value={form.contactEmail} onChange={set("contactEmail")} className="bg-card border-border" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" /> Phone number
                    </Label>
                    <Input placeholder="+1 555 000 0000" value={form.phone} onChange={set("phone")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" /> Specialties
                    </Label>
                    <Input placeholder="e.g. Japanese, Blackwork, Realism" value={form.specialties} onChange={set("specialties")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Years of experience
                    </Label>
                    <Input type="number" min="0" max="60" placeholder="e.g. 8" value={form.yearsExperience} onChange={set("yearsExperience")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-cyan-400" /> Languages spoken
                    </Label>
                    <Input placeholder="e.g. English, Spanish" value={form.languages} onChange={set("languages")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Price range
                    </Label>
                    <Input placeholder="e.g. $150–$300/hr or From $200" value={form.priceRange} onChange={set("priceRange")} className="bg-card border-border" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground">Bio</Label>
                  <Textarea
                    placeholder="Tell clients about your style, experience, and what makes your work unique..."
                    value={form.bio}
                    onChange={set("bio")}
                    className="bg-card border-border min-h-[100px] resize-none"
                    maxLength={2000}
                  />
                  <p className="text-[10px] text-muted-foreground/60 text-right">{form.bio.length}/2000</p>
                </div>

                {/* Team option */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="teamSignup"
                      checked={form.isTeamSignup}
                      onChange={(e) => setForm((f) => ({ ...f, isTeamSignup: e.target.checked }))}
                      className="mt-0.5 accent-purple-500"
                    />
                    <div>
                      <label htmlFor="teamSignup" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-purple-400" /> Register as a Studio / Team
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Create a studio account and invite multiple artists to join your team.
                      </p>
                    </div>
                  </div>
                  {form.isTeamSignup && (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm text-foreground">Studio name *</Label>
                        <Input placeholder="e.g. Ink & Soul Studio" value={form.studioName} onChange={set("studioName")} className="bg-background border-border" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm text-foreground">Studio description</Label>
                        <Textarea placeholder="Describe your studio..." value={form.studioDescription} onChange={set("studioDescription")} className="bg-background border-border min-h-[80px] resize-none" maxLength={500} />
                      </div>
                    </div>
                  )}
                </div>

                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={handleNext}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Your Location</h2>
                  <p className="text-sm text-muted-foreground">Help clients find you in the directory.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Street address
                    </Label>
                    <Input placeholder="e.g. 123 Ink Street" value={form.address} onChange={set("address")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">City / Suburb</Label>
                    <Input placeholder="e.g. Melbourne" value={form.city} onChange={set("city")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">State / Province</Label>
                    <Input placeholder="e.g. Victoria" value={form.state} onChange={set("state")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">Country</Label>
                    <select
                      value={form.country}
                      onChange={set("country")}
                      className="w-full h-10 px-3 rounded-md bg-card border border-border text-sm text-foreground"
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">Postcode / ZIP</Label>
                    <Input placeholder="e.g. 3000" value={form.postcode} onChange={set("postcode")} className="bg-card border-border" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-border/40" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={handleNext}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Portfolio ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Portfolio & Social Links</h2>
                  <p className="text-sm text-muted-foreground">Showcase your work and connect your social presence.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-cyan-400" /> Instagram handle
                    </Label>
                    <Input placeholder="@yourstudio" value={form.instagram} onChange={set("instagram")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">TikTok handle</Label>
                    <Input placeholder="@yourstudio" value={form.tiktok} onChange={set("tiktok")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground">Facebook page</Label>
                    <Input placeholder="facebook.com/yourstudio" value={form.facebook} onChange={set("facebook")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website
                    </Label>
                    <Input placeholder="https://yourstudio.com" value={form.website} onChange={set("website")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" /> Profile photo URL
                    </Label>
                    <Input placeholder="https://..." value={form.profilePhotoUrl} onChange={set("profilePhotoUrl")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-foreground">Portfolio image URLs</Label>
                    <Textarea
                      placeholder="Paste image URLs separated by commas..."
                      value={form.portfolioImages}
                      onChange={set("portfolioImages")}
                      className="bg-card border-border min-h-[80px] resize-none text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground/60">Separate multiple URLs with commas. Must start with https://</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-border/40" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={handleNext}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 4: Hours ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Business Hours & Rates</h2>
                  <p className="text-sm text-muted-foreground">Let clients know when you're available and what to expect.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Hourly rate (USD)
                    </Label>
                    <Input type="number" min="0" placeholder="e.g. 150" value={form.hourlyRate} onChange={set("hourlyRate")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Booking deposit (USD)
                    </Label>
                    <Input type="number" min="0" placeholder="e.g. 50" value={form.depositAmount} onChange={set("depositAmount")} className="bg-card border-border" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-foreground flex items-center gap-1.5 mb-3">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Opening hours
                  </Label>
                  <div className="space-y-2">
                    {DAYS.map((day) => {
                      const h = form.businessHours[day];
                      return (
                        <div key={day} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                          <div className="w-24 text-xs font-medium text-foreground">{day}</div>
                          <input
                            type="checkbox"
                            checked={!h.closed}
                            onChange={(e) => setHours(day, "closed", !e.target.checked)}
                            className="accent-cyan-500"
                            title={h.closed ? "Closed" : "Open"}
                          />
                          {!h.closed ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                type="time"
                                value={h.open}
                                onChange={(e) => setHours(day, "open", e.target.value)}
                                className="bg-background border-border h-8 text-xs w-28"
                              />
                              <span className="text-xs text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={h.close}
                                onChange={(e) => setHours(day, "close", e.target.value)}
                                className="bg-background border-border h-8 text-xs w-28"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-border/40" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-bold" onClick={handleNext}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 5: Payment ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Review & Confirm Partnership</h2>
                  <p className="text-sm text-muted-foreground">
                    Review the partnership terms and commission structure before joining.
                  </p>
                </div>

                {/* Commission & process summary */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/40 bg-cyan-500/5">
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Percent className="w-4 h-4 text-cyan-400" />
                      Partnership & Commission Summary
                    </p>
                  </div>
                  <div className="px-5 py-4 space-y-3 text-sm text-muted-foreground">
                    <p>By joining the tatt-ooo partner network, you agree to the following:</p>
                    <ul className="space-y-2 list-none">
                      {[
                        { label: "What we provide:", value: "Client traffic generation, marketing, and AI-prepared design briefs delivered to your studio for every booking enquiry." },
                        { label: "What you provide:", value: "Your tattooing expertise. Review the client's brief, send a quote, and complete the booking." },
                        { label: "Membership fee:", value: "Charged upfront at signup: Solo Artist $29/year · Studio Team $49/month or $479/year. This is your only direct cost to tatt-ooo." },
                        { label: "13% booking fee:", value: "Paid by the client to tatt-ooo online when they confirm a booking. You are not charged this fee. You receive 100% of your quoted rate, paid directly by the client at your studio on the day." },
                        { label: "What you receive:", value: "A guaranteed, pre-committed client with a printable to-scale tattoo design file — everything you need to prepare and execute the work." },
                        { label: "Quote response time:", value: "You must respond to booking requests within 24 hours. Unanswered requests are automatically cancelled and the client is notified to choose another studio." },
                        { label: "Booking flow:", value: "Client submits brief → you send a quote → client picks a date/time from your available slots → client pays tatt-ooo 13% online → booking confirmed → client comes to you on the day and pays your full rate." },
                      ].map((item) => (
                        <li key={item.label} className="flex gap-2">
                          <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span><strong className="text-foreground">{item.label}</strong> {item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Profile summary */}
                <div className="bg-card/60 border border-border/40 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your listing</p>
                  <p className="text-sm font-bold text-foreground">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.contactEmail}</p>
                  {(form.city || form.country) && <p className="text-xs text-muted-foreground">📍 {[form.city, form.country].filter(Boolean).join(", ")}</p>}
                  {form.specialties && <p className="text-xs text-muted-foreground">🎨 {form.specialties}</p>}
                  {form.isTeamSignup && form.studioName && <p className="text-xs text-purple-400">🏢 Studio: {form.studioName}</p>}
                </div>

                {/* T&C agreement checkbox */}
                <div className={cn(
                  "border rounded-xl p-4 transition-colors",
                  agreedToTerms ? "border-green-500/30 bg-green-500/5" : "border-border/40 bg-card/40"
                )}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 accent-cyan-500 w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      I have read and understood the partnership terms above. I agree to the{" "}
                      <a href="/terms" target="_blank" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                        tatt-ooo Terms of Service
                      </a>{" "}
                      and confirm that a <strong className="text-foreground">membership fee</strong> applies at signup. I understand that clients pay tatt-ooo a <strong className="text-foreground">13% booking fee</strong> online to confirm appointments, and pay me directly for the full job on the day. I agree to respond to all booking requests within 24 hours.
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  Secure checkout via Stripe. Your card details are never stored by tatt-ooo.
                </div>

                {applyMutation.isPending ? (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span className="text-sm text-muted-foreground">Preparing your account...</span>
                  </div>
                ) : applyMutation.isSuccess ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-foreground font-semibold">Application submitted successfully</p>
                    <p className="text-xs text-muted-foreground mt-1">Our team will review your profile within 24–48 hours and send you a confirmation email.</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-border/40" onClick={() => setStep(4)}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      className={cn(
                        "flex-1 font-bold text-base py-3 transition-all",
                        agreedToTerms
                          ? "bg-cyan-500 hover:bg-cyan-600 text-black"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                      onClick={handleSubmit}
                      disabled={applyMutation.isPending || !agreedToTerms}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm & Join tatt-ooo
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/50 text-center">
                  By confirming, you agree to our Terms of Service and the 13% commission structure described above.
                  Your studio listing will be reviewed and activated within 24–48 hours of submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
