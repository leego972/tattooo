import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ChevronRight,
  Plus,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.includes("T") ? "" : "T00:00:00")) : d;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "confirmed" || status === "deposit_paid" || status === "completed")
    return <CheckCircle2 className="w-5 h-5 text-green-400" />;
  if (status === "cancelled")
    return <XCircle className="w-5 h-5 text-red-400" />;
  return <Clock className="w-5 h-5 text-amber-400" />;
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending:      { label: "Waiting for Artist",  className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    confirmed:    { label: "Confirmed!",           className: "bg-green-500/15 text-green-400 border-green-500/30" },
    cancelled:    { label: "Declined",             className: "bg-red-500/15 text-red-400 border-red-500/30" },
    deposit_paid: { label: "Deposit Paid",         className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    completed:    { label: "Completed",            className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  };
  const s = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

// ── New Booking Dialog ────────────────────────────────────────────────────────
function NewBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<{ id: number; name: string; city?: string | null; country?: string | null } | null>(null);
  const [form, setForm] = useState({ date: "", phone: "", notes: "" });

  const { data: artists = [] } = trpc.artists.list.useQuery(
    { name: search, limit: 10 },
    { enabled: search.length > 1 }
  );

  const request = trpc.booking.request.useMutation({
    onSuccess: () => {
      utils.booking.myBookings.invalidate();
      toast.success("Booking request sent! The artist will confirm shortly.");
      onClose();
      setSelectedArtist(null);
      setForm({ date: "", phone: "", notes: "" });
      setSearch("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
            Book an Artist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!selectedArtist ? (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Search Artist or Studio</label>
                <Input
                  placeholder="Type a name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {artists.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {artists.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedArtist(a)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {a.profilePhotoUrl ? (
                          <img src={a.profilePhotoUrl} alt={a.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.name}</p>
                        {(a.city || a.country) && (
                          <p className="text-xs text-muted-foreground truncate">{[a.city, a.country].filter(Boolean).join(", ")}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {search.length > 1 && artists.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No artists found. Try a different name.</p>
              )}
              <div className="pt-2 text-center">
                <Link href="/artists" onClick={onClose}>
                  <Button variant="outline" size="sm" className="gap-2">
                    Browse All Artists <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{selectedArtist.name}</p>
                  {(selectedArtist.city || selectedArtist.country) && (
                    <p className="text-xs text-muted-foreground">{[selectedArtist.city, selectedArtist.country].filter(Boolean).join(", ")}</p>
                  )}
                </div>
                <button onClick={() => setSelectedArtist(null)} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Preferred Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Your Phone (optional)</label>
                <Input placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Notes for the Artist</label>
                <Textarea
                  placeholder="Describe your tattoo idea, size, placement, any references…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button
                className="w-full font-bold text-base"
                size="lg"
                disabled={request.isPending}
                onClick={() => request.mutate({
                  artistId: selectedArtist.id,
                  preferredDate: form.date || undefined,
                  customerPhone: form.phone || undefined,
                  notes: form.notes || undefined,
                })}
              >
                {request.isPending ? "Sending Request…" : "Send Booking Request"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Alternative Artists Card ──────────────────────────────────────────────────
function AlternativeArtists({ alternatives }: {
  alternatives: { id: number; name: string; city?: string | null; country?: string | null }[];
}) {
  if (!alternatives.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Available Artists Near You</p>
      {alternatives.map(a => (
        <Link key={a.id} href={`/artists/${a.id}`}>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{a.name}</p>
              {(a.city || a.country) && (
                <p className="text-xs text-muted-foreground">{[a.city, a.country].filter(Boolean).join(", ")}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const { user } = useAuth();
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  const { data: bookings = [], isLoading } = trpc.booking.myBookings.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please log in to view your bookings.</p>
          <Link href="/login"><Button>Log In</Button></Link>
        </div>
      </div>
    );
  }

  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "deposit_paid");
  const past = bookings.filter(b => b.status === "cancelled" || b.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="text-xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
                TATT<span className="text-primary">OOO</span>
              </span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Bookings</span>
          </div>
          <Button onClick={() => setNewBookingOpen(true)} className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            Book an Artist
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-wider gradient-text" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
            My Appointments
          </h1>
          <p className="text-muted-foreground mt-1">Track all your tattoo booking requests here.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl shimmer" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto opacity-40" />
            <h2 className="text-2xl font-black tracking-wider text-muted-foreground" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
              No Bookings Yet
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Ready to get inked? Browse our artists and request your first appointment.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/artists">
                <Button variant="outline" className="gap-2">Browse Artists</Button>
              </Link>
              <Button onClick={() => setNewBookingOpen(true)} className="gap-2 font-bold">
                <Plus className="w-4 h-4" /> Book Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending */}
            {pending.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  Waiting for Confirmation ({pending.length})
                </h2>
                {pending.map(b => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </section>
            )}

            {/* Confirmed */}
            {confirmed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-green-400">Confirmed ({confirmed.length})</h2>
                {confirmed.map(b => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </section>
            )}

            {/* Past / Declined */}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past Bookings ({past.length})</h2>
                {past.map(b => (
                  <BookingCard key={b.id} booking={b} onRebook={() => setNewBookingOpen(true)} />
                ))}
              </section>
            )}
          </div>
        )}
      </div>

      <NewBookingDialog open={newBookingOpen} onClose={() => setNewBookingOpen(false)} />
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({
  booking,
  onRebook,
}: {
  booking: {
    id: number;
    status: string;
    preferredDate?: string | null;
    scheduledAt?: Date | null;
    customerNotes?: string | null;
    declineReason?: string | null;
    nextAvailableDate?: string | null;
    createdAt: Date;
    artistId?: number | null;
    artistName?: string | null;
    artistCity?: string | null;
    artistCountry?: string | null;
    artistPhoto?: string | null;
    artistSpecialties?: string | null;
  };
  onRebook?: () => void;
}) {
  // Parse alternatives from notification data if available
  const isDeclined = booking.status === "cancelled";
  const isConfirmed = booking.status === "confirmed" || booking.status === "deposit_paid";

  return (
    <div className={`rounded-xl border p-5 space-y-4 transition-all ${
      isConfirmed
        ? "border-green-500/30 bg-green-500/5"
        : isDeclined
        ? "border-red-500/20 bg-red-500/5"
        : "border-border bg-card"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {booking.artistPhoto ? (
              <img src={booking.artistPhoto} alt={booking.artistName || ""} className="w-10 h-10 object-cover" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-bold text-base">{booking.artistName || "Unknown Artist"}</p>
            {(booking.artistCity || booking.artistCountry) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[booking.artistCity, booking.artistCountry].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={booking.status} />
          {statusLabel(booking.status)}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {booking.preferredDate && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Requested: <span className="text-foreground font-medium">{formatDate(booking.preferredDate)}</span></span>
          </div>
        )}
        {booking.scheduledAt && isConfirmed && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-green-400 font-semibold">Confirmed: {formatDate(booking.scheduledAt)}</span>
          </div>
        )}
        {booking.customerNotes && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <span className="text-muted-foreground italic text-xs">"{booking.customerNotes}"</span>
          </div>
        )}
      </div>

      {/* Declined — show reason + next available + alternatives */}
      {isDeclined && (
        <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {booking.declineReason && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Reason:</span> {booking.declineReason}
                </p>
              )}
              {booking.nextAvailableDate && (
                <p className="text-sm">
                  <span className="font-semibold">Next available:</span>{" "}
                  <span className="text-primary font-bold">{formatDate(booking.nextAvailableDate)}</span>
                  {" — "}
                  <button
                    onClick={onRebook}
                    className="text-primary hover:underline text-sm font-semibold inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Rebook for this date
                  </button>
                </p>
              )}
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Or try another artist:</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/artists">
                <Button size="sm" variant="outline" className="gap-1 text-xs">
                  <MapPin className="w-3 h-3" /> Browse Artists Near Me
                </Button>
              </Link>
              {onRebook && (
                <Button size="sm" onClick={onRebook} className="gap-1 text-xs font-bold">
                  <Plus className="w-3 h-3" /> Book a Different Artist
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmed — show big green confirmation */}
      {isConfirmed && booking.scheduledAt && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">You're all set!</p>
            <p className="text-xs text-muted-foreground">
              Your appointment is confirmed for {formatDate(booking.scheduledAt)}. Check your email for details.
            </p>
          </div>
        </div>
      )}

      {/* View artist profile link */}
      {booking.artistId && (
        <div className="pt-1">
          <Link href={`/artists/${booking.artistId}`}>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              View Artist Profile <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
