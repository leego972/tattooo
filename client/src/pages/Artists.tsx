import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin,
  Instagram,
  Globe,
  Mail,
  Search,
  Star,
  Palette,
  Send,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  UserPlus,
  Shield,
  CreditCard,
} from "lucide-react";

interface ContactFormData {
  customerName: string;
  customerEmail: string;
  message: string;
  designUrl?: string;
}

export default function Artists() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [locationFilter, setLocationFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  const [bookingArtist, setBookingArtist] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    customerName: "",
    customerEmail: "",
    message: "",
  });
  const [bookingMsg, setBookingMsg] = useState("");


  const { data: artistList = [], isLoading } = trpc.artists.list.useQuery({
    location: locationFilter || undefined,
    specialty: specialtyFilter || undefined,
    limit: 50,
  });

  const contactMutation = trpc.artists.contact.useMutation({
    onSuccess: () => {
      toast.success("Message sent! The artist will be in touch soon.");
      setSelectedArtist(null);
      setContactForm({ customerName: "", customerEmail: "", message: "" });
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
      setBookingArtist(null);
      setBookingMsg("");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to create booking."),
  });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtist) return;
    contactMutation.mutate({ artistId: selectedArtist, ...contactForm });
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingArtist) return;
    bookingMutation.mutate({
      artistId: bookingArtist,
      message: bookingMsg,
      origin: window.location.origin,
    });
  };

  const selectedArtistData = artistList.find((a) => a.id === selectedArtist);
  const bookingArtistData = artistList.find((a) => a.id === bookingArtist);
  const _ = showRegister; // used in JSX below

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Find an Artist</h1>
              <p className="text-sm text-muted-foreground">
                Connect with verified tattoo artists who can bring your design to life
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by location (e.g. London, NYC)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="relative flex-1">
            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by style (e.g. Japanese, Blackwork)"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        {/* Artists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-6 animate-pulse h-48"
              />
            ))}
          </div>
        ) : artistList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No artists found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {locationFilter || specialtyFilter
                ? "Try adjusting your filters to see more artists."
                : "The artist directory is coming soon. Check back shortly!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artistList.map((artist) => (
              <div
                key={artist.id}
                className="bg-card border border-border rounded-2xl p-6 hover:border-cyan-500/40 transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {artist.avatarUrl ? (
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-cyan-400">
                        {artist.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground truncate">{artist.name}</h3>
                      {artist.verified && (
                        <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 flex-shrink-0" />
                      )}
                    </div>
                    {artist.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {artist.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {artist.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{artist.bio}</p>
                )}

                {/* Specialties */}
                {artist.specialties && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {artist.specialties
                      .split(",")
                      .slice(0, 3)
                      .map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {s.trim()}
                        </span>
                      ))}
                  </div>
                )}

                {/* Links + Contact */}
                <div className="flex items-center gap-2 mt-auto">
                  {artist.instagram && (
                    <a
                      href={`https://instagram.com/${artist.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted/30 hover:bg-pink-500/10 hover:text-pink-400 text-muted-foreground transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {artist.website && (
                    <a
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted/30 hover:bg-cyan-500/10 hover:text-cyan-400 text-muted-foreground transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 text-xs"
                      onClick={() => setBookingArtist(artist.id)}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Book
                    </Button>
                    {artist.contactEmail && (
                      <Button
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold"
                        onClick={() => setSelectedArtist(artist.id)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Artist Registration CTA */}
        <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Are you a tattoo artist?</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Join the tatt-ooo artist directory and connect with customers who've already designed
            their perfect tattoo using AI.
          </p>
          <Button
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            onClick={() => navigate("/artist-signup")}
          >
            Apply to Join — $29/year
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingArtist !== null} onOpenChange={(open) => !open && setBookingArtist(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Book {bookingArtistData?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A deposit of <strong className="text-foreground">${bookingArtistData?.depositAmount ?? 50}</strong> is
              required to secure your appointment. Paid securely via Stripe.
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
              {bookingMutation.isPending ? "Processing…" : `Pay $${bookingArtistData?.depositAmount ?? 50} Deposit`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={selectedArtist !== null} onOpenChange={(open) => !open && setSelectedArtist(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Contact {selectedArtistData?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message to this artist about your tattoo design.
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
                value={contactForm.designUrl || ""}
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
    </div>
  );
}
