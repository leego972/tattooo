import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  StickyNote,
  AlertCircle,
  DollarSign,
  Layers,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending:      { label: "Pending",   className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    confirmed:    { label: "Confirmed", className: "bg-green-500/15 text-green-400 border-green-500/30" },
    cancelled:    { label: "Declined",  className: "bg-red-500/15 text-red-400 border-red-500/30" },
    deposit_paid: { label: "Deposit Paid", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    completed:    { label: "Completed", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  };
  const s = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

// ── Calendar Component ────────────────────────────────────────────────────────
function AvailabilityCalendar({ artistId }: { artistId: number }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ startTime: "10:00", endTime: "18:00", notes: "" });

  const utils = trpc.useUtils();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const { data: allSlots = [] } = trpc.availability.mySlots.useQuery();
  // Filter to current month
  const slots = allSlots.filter(s => s.date.startsWith(monthKey));

  const addSlot = trpc.availability.setSlots.useMutation({
    onSuccess: () => {
      utils.availability.mySlots.invalidate();
      setAddingDate(null);
      toast.success("Availability added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeSlot = trpc.availability.removeSlot.useMutation({
    onSuccess: () => {
      utils.availability.mySlots.invalidate();
      toast.success("Slot removed.");
    },
    onError: (e) => toast.error(e.message),
  });

  // Build calendar grid
  const firstDow = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const slotsByDate: Record<string, typeof slots[0][]> = {};
  for (const s of slots) {
    if (!slotsByDate[s.date]) slotsByDate[s.date] = [];
    slotsByDate[s.date].push(s);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function handleDayClick(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (d < todayStr) return;
    setAddingDate(d);
    setAddForm({ startTime: "10:00", endTime: "18:00", notes: "" });
  }

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1 tracking-widest uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySlots = slotsByDate[dateStr] || [];
          const isPast = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          const hasAvail = daySlots.length > 0;
          const isBooked = daySlots.some(s => s.isBooked);

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && handleDayClick(day)}
              disabled={isPast}
              className={`
                relative aspect-square rounded-lg text-sm font-medium transition-all
                flex flex-col items-center justify-center gap-0.5
                ${isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-secondary cursor-pointer"}
                ${isToday ? "ring-2 ring-primary" : ""}
                ${isBooked ? "bg-primary/20 text-primary" : hasAvail ? "bg-green-500/15 text-green-400" : ""}
              `}
            >
              <span>{day}</span>
              {hasAvail && !isBooked && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              )}
              {isBooked && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" /> Unavailable</span>
      </div>

      {/* Existing slots list */}
      {slots.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Available Slots This Month</p>
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
              <div>
                <span className="font-semibold text-sm">{formatDate(slot.date)}</span>
              {slot.timeSlot && slot.timeSlot !== "all-day" && (
                <span className="text-xs text-muted-foreground ml-2">{slot.timeSlot}</span>
              )}
                {slot.isBooked && <span className="ml-2 text-xs text-primary font-semibold">BOOKED</span>}
              </div>
              {!slot.isBooked && (
                <button
                  onClick={() => removeSlot.mutate({ date: slot.date })}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add slot dialog */}
      <Dialog open={!!addingDate} onOpenChange={() => setAddingDate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Availability — {addingDate ? formatDate(addingDate) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Start Time</label>
                <Input type="time" value={addForm.startTime} onChange={e => setAddForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">End Time</label>
                <Input type="time" value={addForm.endTime} onChange={e => setAddForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Notes (optional)</label>
              <Input placeholder="e.g. Large pieces only" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button
              className="w-full"
              onClick={() => addSlot.mutate({ slots: [{ date: addingDate!, timeSlot: `${addForm.startTime}–${addForm.endTime}` }] })}
              disabled={addSlot.isPending}
            >
              {addSlot.isPending ? "Saving…" : "Save Availability"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: notifs = [] } = trpc.notifications.list.useQuery(undefined, { refetchInterval: 30000 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
      >
        {unread > 0 ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-bold text-sm tracking-wider uppercase">Notifications</span>
            {unread > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : notifs.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead.mutate({ id: n.id })}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 ${!n.isRead ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onConfirm, onDecline, onSendQuote }: {
  booking: {
    id: number;
    status: string;
    preferredDate?: string | null;
    customerNotes?: string | null;
    customerPhone?: string | null;
    createdAt: Date;
    customerName?: string | null;
    customerEmail?: string | null;
  };
  onConfirm: (id: number) => void;
  onDecline: (id: number) => void;
  onSendQuote: (id: number) => void;
}) {
  return (
    <div className={`rounded-xl border p-5 space-y-4 transition-all ${
      booking.status === "pending"
        ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_oklch(0.70_0.14_75/0.08)]"
        : "border-border bg-card"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-base">{booking.customerName || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              Requested {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {statusBadge(booking.status)}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {booking.preferredDate && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">{formatDate(booking.preferredDate)}</span>
          </div>
        )}
        {booking.customerPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{booking.customerPhone}</span>
          </div>
        )}
        {booking.customerEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <a href={`mailto:${booking.customerEmail}`} className="text-primary hover:underline truncate">{booking.customerEmail}</a>
          </div>
        )}
        {booking.customerNotes && (
          <div className="flex items-start gap-2 text-sm sm:col-span-2">
            <StickyNote className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground italic">"{booking.customerNotes}"</span>
          </div>
        )}
      </div>

      {/* Actions — only for pending */}
      {booking.status === "pending" && (
        <div className="flex flex-col gap-2 pt-1">
          <Button
            size="lg"
            className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
            onClick={() => onSendQuote(booking.id)}
          >
            <DollarSign className="w-5 h-5" />
            SEND QUOTE
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={() => onConfirm(booking.id)}
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Direct
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold"
              onClick={() => onDecline(booking.id)}
            >
              <XCircle className="w-4 h-4" />
              Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ArtistDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"inbox" | "calendar">("inbox");
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const [quotingId, setQuotingId] = useState<number | null>(null);
  const [confirmForm, setConfirmForm] = useState({ date: "", time: "" });
  const [declineForm, setDeclineForm] = useState({ reason: "", nextDate: "" });
  const [quoteForm, setQuoteForm] = useState({ amount: "", message: "", isMultiSession: false });

  const utils = trpc.useUtils();
  const { data: inbox = [], isLoading } = trpc.booking.artistInbox.useQuery();
  const { data: artistProfile } = trpc.artists.getMyProfile.useQuery();

  const confirm = trpc.booking.confirm.useMutation({
    onSuccess: () => {
      utils.booking.artistInbox.invalidate();
      setConfirmingId(null);
      toast.success("Booking confirmed! The customer has been notified.");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendQuote = trpc.booking.sendQuote.useMutation({
    onSuccess: (data) => {
      utils.booking.artistInbox.invalidate();
      setQuotingId(null);
      setQuoteForm({ amount: "", message: "", isMultiSession: false });
      toast.success(`Quote sent! Platform fee: $${(data.platformFeeCents / 100).toFixed(2)} (13%). Client will be notified.`);
    },
    onError: (e) => toast.error(e.message),
  });

  const decline = trpc.booking.decline.useMutation({
    onSuccess: () => {
      utils.booking.artistInbox.invalidate();
      setDecliningId(null);
      toast.success("Booking declined. The customer has been notified with alternatives.");
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = inbox.filter(b => b.status === "pending");
  const others = inbox.filter(b => b.status !== "pending");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please log in to access your artist dashboard.</p>
          <Link href="/login"><Button>Log In</Button></Link>
        </div>
      </div>
    );
  }

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
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Artist Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/artist-profile">
              <Button variant="outline" size="sm">My Profile</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-wider gradient-text" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
            Welcome Back, {user.name?.split(" ")[0] || "Artist"}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your bookings and availability from here.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Pending", value: pending.length, color: "text-amber-400" },
            { label: "Confirmed", value: inbox.filter(b => b.status === "confirmed").length, color: "text-green-400" },
            { label: "Total", value: inbox.length, color: "text-foreground" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-3xl font-black ${s.color}`} style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-6 w-fit">
          {(["inbox", "calendar"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md text-sm font-semibold uppercase tracking-wider transition-all ${
                tab === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "inbox" ? (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Bookings {pending.length > 0 && <span className="bg-amber-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pending.length}</span>}
                </span>
              ) : (
                <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Availability</span>
              )}
            </button>
          ))}
        </div>

        {/* Inbox Tab */}
        {tab === "inbox" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl shimmer" />)}
              </div>
            ) : inbox.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-lg font-semibold text-muted-foreground">No bookings yet</p>
                <p className="text-sm text-muted-foreground">When customers request appointments, they'll appear here.</p>
              </div>
            ) : (
              <>
                {pending.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                      Needs Your Response ({pending.length})
                    </p>
                    {pending.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onConfirm={setConfirmingId}
                        onDecline={setDecliningId}
                        onSendQuote={setQuotingId}
                      />
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past Bookings</p>
                    {others.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onConfirm={setConfirmingId}
                        onDecline={setDecliningId}
                        onSendQuote={setQuotingId}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {tab === "calendar" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>Your Availability</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Click any future date to mark yourself as available. Customers will only see available dates when booking.</p>
              </div>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            {/* We need the artist's ID — fetch it */}
            <ArtistCalendarWrapper />
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmingId} onOpenChange={() => setConfirmingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
              Confirm Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Set the confirmed date and time for this appointment.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Date</label>
                <Input type="date" value={confirmForm.date} onChange={e => setConfirmForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Time</label>
                <Input type="time" value={confirmForm.time} onChange={e => setConfirmForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmingId(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate({
                  bookingId: confirmingId!,
                  confirmedDate: confirmForm.date || undefined,
                  confirmedTime: confirmForm.time || undefined,
                })}
              >
                {confirm.isPending ? "Confirming…" : "Confirm Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={!!quotingId} onOpenChange={() => setQuotingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
              Send Quote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Enter the <strong>total price</strong> for the entire piece. We collect a <strong>13% platform fee</strong> from the client when they accept.
            </p>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Total Quote (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 500"
                  className="pl-7"
                  value={quoteForm.amount}
                  onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              {quoteForm.amount && parseFloat(quoteForm.amount) > 0 && (
                <p className="text-xs text-primary mt-1 font-semibold">
                  Platform fee: ${(parseFloat(quoteForm.amount) * 0.13).toFixed(2)} (13%) — paid by client
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Message to Client (optional)</label>
              <Textarea
                placeholder="e.g. This includes 2 sessions, approx 4hrs each. Price covers design, stencil and all sessions."
                value={quoteForm.message}
                onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <input
                type="checkbox"
                id="multi-session"
                checked={quoteForm.isMultiSession}
                onChange={e => setQuoteForm(f => ({ ...f, isMultiSession: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <div>
                <label htmlFor="multi-session" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Multi-session piece
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">Client pays our fee once. Follow-up sessions are booked directly with you.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setQuotingId(null)}>Cancel</Button>
              <Button
                className="flex-1 font-bold"
                disabled={sendQuote.isPending || !quoteForm.amount || parseFloat(quoteForm.amount) <= 0}
                onClick={() => sendQuote.mutate({
                  bookingId: quotingId!,
                  quotedAmountCents: Math.round(parseFloat(quoteForm.amount) * 100),
                  quoteMessage: quoteForm.message || undefined,
                  isMultiSession: quoteForm.isMultiSession,
                })}
              >
                {sendQuote.isPending ? "Sending…" : "Send Quote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={!!decliningId} onOpenChange={() => setDecliningId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-wider" style={{ fontFamily: "'Bebas Neue', Georgia, serif" }}>
              Decline Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">The customer will be notified and shown alternative artists near you.</p>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Reason (optional)</label>
              <Textarea
                placeholder="e.g. Fully booked for that period, style not in my specialty…"
                value={declineForm.reason}
                onChange={e => setDeclineForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Your Next Available Date</label>
              <Input
                type="date"
                value={declineForm.nextDate}
                onChange={e => setDeclineForm(f => ({ ...f, nextDate: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">This will be shown to the customer so they can rebook later.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDecliningId(null)}>Cancel</Button>
              <Button
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold"
                variant="outline"
                disabled={decline.isPending}
                onClick={() => decline.mutate({
                  bookingId: decliningId!,
                  reason: declineForm.reason || undefined,
                  nextAvailableDate: declineForm.nextDate || undefined,
                })}
              >
                {decline.isPending ? "Declining…" : "Decline Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper to fetch artist ID before rendering calendar
function ArtistCalendarWrapper() {
  const { data: myArtist } = trpc.artists.getMyProfile.useQuery();
  if (!myArtist) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>You need an artist profile to manage availability.</p>
        <Link href="/artist-signup">
          <Button className="mt-4" size="sm">Create Artist Profile</Button>
        </Link>
      </div>
    );
  }
  return <AvailabilityCalendar artistId={myArtist.id} />;
}
