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
  // Step 1: Basic info
  name: string;
  contactEmail: string;
  phone: string;
  bio: string;
  specialties: string;
  yearsExperience: string;
  priceRange: string;
  languages: string;
  // Step 2: Location
  address: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  // Step 3: Links & media
  instagram: string;
  tiktok: string;
  facebook: string;
  website: string;
  profilePhotoUrl: string;
  portfolioImages: string; // comma-separated URLs
  // Step 4: Hours & pricing
  hourlyRate: string;
  depositAmount: string;
  businessHours: BusinessHours;
  // Step 5: Team (optional)
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

const BENEFITS = [
  { icon: TrendingUp, title: "Warm leads only",    desc: "Clients arrive with a design already created — they just need an artist to bring it to life." },
  { icon: Users,      title: "Global visibility",  desc: "Get discovered by tattoo enthusiasts worldwide who've designed their perfect tattoo using AI." },
  { icon: Zap,        title: "Instant bookings",   desc: "Clients can book and pay a deposit directly through your profile — no back-and-forth needed." },
  { icon: Shield,     title: "Verified badge",     desc: "Earn a verified artist badge after admin review, building trust with potential clients." },
];

export default function ArtistSignup() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
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
            Thank you for joining the tatt-ooo artist directory. Your payment has been processed and
            your application is now <strong className="text-foreground">pending admin review</strong>.
            We'll send a confirmation to your email once approved — usually within 24–48 hours.
          </p>
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
            {["Our team reviews your profile (24–48 hrs)", "You receive a verified badge on your listing", "Clients start discovering and booking you"].map((t) => (
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
            Join the tatt-ooo Artist Directory
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Connect with clients who've already designed their perfect tattoo using AI — they just need <em>you</em> to bring it to life.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">Why join?</p>
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
              <p className="text-xs text-muted-foreground">Less than $2.50/month. Cancel anytime.</p>
              <div className="mt-3 space-y-1.5">
                {["Verified artist badge", "Unlimited client enquiries", "Booking deposit system", "Global directory listing", "Priority in search results"].map((f) => (
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
            <div className="flex items-center gap-1.5 mb-8 flex-wrap">
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

            {/* ── Step 3: Portfolio & Links ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Portfolio &amp; Links</h2>
                  <p className="text-sm text-muted-foreground">Showcase your work and connect your social profiles.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" /> Profile photo URL
                  </Label>
                  <Input placeholder="https://example.com/your-photo.jpg" value={form.profilePhotoUrl} onChange={set("profilePhotoUrl")} className="bg-card border-border" />
                  <p className="text-xs text-muted-foreground/60">Link to a professional headshot or studio photo.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" /> Portfolio image URLs
                  </Label>
                  <Textarea
                    placeholder="Paste image URLs separated by commas&#10;e.g. https://cdn.example.com/tattoo1.jpg, https://cdn.example.com/tattoo2.jpg"
                    value={form.portfolioImages}
                    onChange={set("portfolioImages")}
                    className="bg-card border-border min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground/60">Up to 20 images. Comma-separated direct image URLs.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram handle
                    </Label>
                    <Input placeholder="@yourstudio" value={form.instagram} onChange={set("instagram")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-muted-foreground" /> TikTok handle
                    </Label>
                    <Input placeholder="@yourtiktok" value={form.tiktok} onChange={set("tiktok")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" /> Facebook URL
                    </Label>
                    <Input placeholder="https://facebook.com/yourpage" value={form.facebook} onChange={set("facebook")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website
                    </Label>
                    <Input placeholder="https://yourstudio.com" value={form.website} onChange={set("website")} className="bg-card border-border" />
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

            {/* ── Step 4: Business Hours & Pricing ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Hours &amp; Pricing</h2>
                  <p className="text-sm text-muted-foreground">Set your availability and booking deposit.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Hourly rate (USD)
                    </Label>
                    <Input type="number" min="0" placeholder="e.g. 200" value={form.hourlyRate} onChange={set("hourlyRate")} className="bg-card border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Booking deposit (USD)
                    </Label>
                    <Input type="number" min="10" placeholder="e.g. 50" value={form.depositAmount} onChange={set("depositAmount")} className="bg-card border-border" />
                    <p className="text-xs text-muted-foreground/60">Clients pay this to secure their appointment.</p>
                  </div>
                </div>

                {/* Business hours */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Business Hours</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {DAYS.map((day) => {
                      const h = form.businessHours[day];
                      return (
                        <div key={day} className="flex items-center gap-3 px-4 py-2.5">
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
                  <h2 className="text-xl font-bold text-foreground mb-1">Annual Listing Fee</h2>
                  <p className="text-sm text-muted-foreground">
                    One payment of <strong className="text-foreground">$29/year</strong> to be listed in the tatt-ooo artist directory.
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
                        <p className="text-sm font-medium text-foreground">tatt-ooo Artist Directory Listing</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your listing</p>
                  <p className="text-sm font-bold text-foreground">{form.name}</p>
                  <p className="text-xs text-muted-foreground">{form.contactEmail}</p>
                  {(form.city || form.country) && <p className="text-xs text-muted-foreground">📍 {[form.city, form.country].filter(Boolean).join(", ")}</p>}
                  {form.specialties && <p className="text-xs text-muted-foreground">🎨 {form.specialties}</p>}
                  {form.isTeamSignup && form.studioName && <p className="text-xs text-purple-400">🏢 Studio: {form.studioName}</p>}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  Secure payment via Stripe. Your card details are never stored by tatt-ooo.
                </div>

                {applyMutation.isPending ? (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    <span className="text-sm text-muted-foreground">Preparing your checkout session...</span>
                  </div>
                ) : applyMutation.isSuccess ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-foreground font-semibold">Checkout opened in a new tab</p>
                    <p className="text-xs text-muted-foreground mt-1">Complete your payment there. This page will update once confirmed.</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-border/40" onClick={() => setStep(4)}>
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
                  By proceeding you agree to our Terms of Service. Annual fee renews automatically. Cancel anytime from your account settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
