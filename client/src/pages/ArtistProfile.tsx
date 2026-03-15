import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Globe,
  Instagram,
  Star,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  Send,
  Shield,
  CreditCard,
  ArrowLeft,
  Users,
  Languages,
  Briefcase,
  CheckCircle,
  Facebook,
} from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ArtistProfile() {
  const [, params] = useRoute("/artists/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const artistId = params?.id ? parseInt(params.id, 10) : null;

  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [contactForm, setContactForm] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    message: "",
    designUrl: "",
  });
  const [bookingMsg, setBookingMsg] = useState("");

  const { data: artist, isLoading } = trpc.artists.getById.useQuery(
    { id: artistId! },
    { enabled: !!artistId }
  );

  const contactMutation = trpc.artists.contact.useMutation({
    onSuccess: () => {
      toast.success("Message sent! The artist will be in touch soon.");
      setShowContact(false);
      setContactForm({ customerName: "", customerEmail: "", message: "", designUrl: "" });
    },
    onError: (err) => toast.error(err.message || "Failed to send message."),
  });

  const bookingMutation = trpc.artists.requestBooking.useMutation({
    onSuccess: (data: { bookingId: number; checkoutUrl: string }) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure payment...");
        window.open(data.checkoutUrl, "_blank");
      } else {
        toast.success("Booking request sent! The artist will confirm shortly.");
      }
      setShowBooking(false);
      setBookingMsg("");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to create booking."),
  });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return;
    contactMutation.mutate({ artistId, ...contactForm });
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return;
    bookingMutation.mutate({ artistId, message: bookingMsg, origin: window.location.origin });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/30 animate-pulse mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Artist not found</h2>
          <p className="text-sm text-muted-foreground mb-4">This artist profile doesn't exist or is not yet verified.</p>
          <Button onClick={() => navigate("/artists")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
          </Button>
        </div>
      </div>
    );
  }

  type HoursEntry = { open: string; close: string; closed?: boolean };
  let businessHours: Record<string, HoursEntry> = {};
  try {
    if (typeof artist.businessHours === "string") {
      businessHours = JSON.parse(artist.businessHours) as Record<string, HoursEntry>;
    } else if (artist.businessHours && typeof artist.businessHours === "object") {
      businessHours = artist.businessHours as unknown as Record<string, HoursEntry>;
    }
  } catch {}

  let portfolioImages: string[] = [];
  try {
    if (typeof artist.portfolioImages === "string") {
      portfolioImages = JSON.parse(artist.portfolioImages);
    } else if (Array.isArray(artist.portfolioImages)) {
      portfolioImages = artist.portfolioImages as string[];
    }
  } catch {}

  const addressParts = [artist.address, artist.city, artist.state, artist.postcode, artist.country].filter(Boolean);
  const languages = artist.languages ? artist.languages.split(",").map((l: string) => l.trim()) : [];
  const specialties = artist.specialties ? artist.specialties.split(",").map((s: string) => s.trim()) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/artists">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Artists
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Cover / gradient banner */}
          <div className="h-32 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-4 border-card flex items-center justify-center overflow-hidden flex-shrink-0">
                {(artist.profilePhotoUrl || artist.avatarUrl) ? (
                  <img
                    src={artist.profilePhotoUrl || artist.avatarUrl || ""}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-cyan-400">
                    {artist.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{artist.name}</h1>
                  {artist.verified && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {artist.isTeamOwner && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Users className="w-3 h-3" /> Studio
                    </span>
                  )}
                </div>
                {addressParts.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{addressParts.join(", ")}</span>
                  </div>
                )}
              </div>
              {/* CTA Buttons */}
              <div className="flex gap-2 sm:ml-auto flex-shrink-0">
                {artist.contactEmail && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-muted/30"
                    onClick={() => setShowContact(true)}
                  >
                    <Mail className="w-4 h-4 mr-1.5" />
                    Message
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                  onClick={() => setShowBooking(true)}
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Book Now
                </Button>
              </div>
            </div>

            {/* Bio */}
            {artist.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{artist.bio}</p>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              {artist.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`tel:${artist.phone}`} className="text-foreground hover:text-cyan-400 transition-colors">{artist.phone}</a>
                </div>
              )}
              {artist.contactEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${artist.contactEmail}`} className="text-foreground hover:text-cyan-400 transition-colors truncate">{artist.contactEmail}</a>
                </div>
              )}
              {artist.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate">{artist.website.replace(/^https?:\/\//, "")}</a>
                </div>
              )}
              {artist.instagram && (
                <div className="flex items-center gap-3 text-sm">
                  <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`https://instagram.com/${artist.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">@{artist.instagram.replace("@", "")}</a>
                </div>
              )}
              {artist.tiktok && (
                <div className="flex items-center gap-3 text-sm">
                  <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`https://tiktok.com/@${artist.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-cyan-400 transition-colors">@{artist.tiktok.replace("@", "")}</a>
                </div>
              )}
              {artist.facebook && (
                <div className="flex items-center gap-3 text-sm">
                  <Facebook className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={artist.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">{artist.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, "")}</a>
                </div>
              )}
              {artist.priceRange && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{artist.priceRange}</span>
                </div>
              )}
              {artist.yearsExperience && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{artist.yearsExperience} years experience</span>
                </div>
              )}
              {languages.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Languages className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{languages.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Business Hours */}
            {Object.keys(businessHours).length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Business Hours</h3>
                </div>
                <div className="space-y-1.5">
                  {DAY_ORDER.filter((d) => businessHours[d]).map((day) => {
                    const h = businessHours[day];
                    const label = h.closed ? "Closed" : `${h.open} – ${h.close}`;
                    return (
                      <div key={day} className="flex justify-between text-xs">
                        <span className="text-muted-foreground w-24">{day}</span>
                        <span className={h.closed ? "text-muted-foreground" : "text-foreground"}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deposit Info */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">Booking Deposit</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                A <strong className="text-foreground">${artist.depositAmount ?? 50}</strong> deposit is required to secure your appointment. Held securely via Stripe.
              </p>
              <Button
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm"
                onClick={() => setShowBooking(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>

          {/* Right: Portfolio */}
          <div className="lg:col-span-2 space-y-4">
            {portfolioImages.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Portfolio</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolioImages.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border">
                      <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Portfolio coming soon</p>
              </div>
            )}

            {/* Team Members */}
            {artist.team && artist.team.members && artist.team.members.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Our Team — {artist.team.studioName}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {artist.team.members.map((m) => (
                    <Link key={m.id} href={`/artists/${m.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {(m.profilePhotoUrl || m.avatarUrl) ? (
                            <img src={m.profilePhotoUrl || m.avatarUrl || ""} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-cyan-400">{m.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          {m.specialties && <p className="text-xs text-muted-foreground truncate">{m.specialties.split(",")[0]}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Contact {artist.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message about your tattoo design.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContact} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Your name</Label>
              <Input
                placeholder="Your full name"
                value={contactForm.customerName}
                onChange={(e) => setContactForm((f) => ({ ...f, customerName: e.target.value }))}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Your email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={contactForm.customerEmail}
                onChange={(e) => setContactForm((f) => ({ ...f, customerEmail: e.target.value }))}
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Message</Label>
              <Textarea
                placeholder="Describe your tattoo idea, placement, size, and any questions..."
                value={contactForm.message}
                onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                className="bg-background border-border min-h-[100px] resize-none"
                required
                minLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Design link (optional)</Label>
              <Input
                placeholder="Paste your tatt-ooo design URL"
                value={contactForm.designUrl}
                onChange={(e) => setContactForm((f) => ({ ...f, designUrl: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              disabled={contactMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {contactMutation.isPending ? "Sending…" : "Send Message"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Book {artist.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A deposit of <strong className="text-foreground">${artist.depositAmount ?? 50}</strong> is required to secure your appointment. Paid securely via Stripe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBooking} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Message to artist</Label>
              <Textarea
                placeholder="Describe your tattoo idea, preferred dates, size, placement..."
                value={bookingMsg}
                onChange={(e) => setBookingMsg(e.target.value)}
                className="bg-background border-border min-h-[100px] resize-none"
                required
                minLength={10}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-green-400" />
              Secure payment via Stripe. Deposit held until appointment confirmed.
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              disabled={bookingMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {bookingMutation.isPending ? "Processing…" : `Pay $${artist.depositAmount ?? 50} Deposit`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
