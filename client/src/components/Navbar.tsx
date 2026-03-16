import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Sparkles,
  Images,
  Clock,
  LogOut,
  LogIn,
  Menu,
  X,
  BookMarked,
  PenTool,
  Zap,
  DollarSign,
  Users,
  Gift,
  UserPlus,
  Mail,
  BarChart2,
  Megaphone,
  CreditCard,
  Tag,
  CalendarDays,
  LayoutDashboard,
  Bell,
  CheckCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/assets/tattooo-logo.png";
const LEEGO_URL = "/assets/leego-logo.png";

// Leego logo with click-to-enlarge animation (2× for 3 seconds)
function LeegoLogo({ size = 36 }: { size?: number }) {
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
        opacity: enlarged ? 1 : 0.9,
      }}
    />
  );
}

// Links shown only when authenticated
const authNavLinks = [
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/my-tatts", label: "My Tatts", icon: BookMarked },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/draw", label: "Drawing Board", icon: PenTool },
  { href: "/history", label: "History", icon: Clock },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/artists", label: "Find Artist", icon: Users },
  { href: "/my-bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/referral", label: "Refer & Earn", icon: Gift },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/artist-dashboard", label: "Artist Dashboard", icon: LayoutDashboard },
];

// Links shown to everyone (logged out)
const publicNavLinks = [
  { href: "/login", label: "Sign In", icon: LogIn },
  { href: "/signup", label: "Create Account", icon: Sparkles },
  { href: "/artist-signup", label: "Join as Artist", icon: UserPlus },
];

const adminNavLinks = [
  { href: "/admin", label: "Admin Panel", icon: Users },
  { href: "/admin/promos", label: "Promo Codes", icon: Tag },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/mailing-list", label: "Mailing List", icon: Mail },
  { href: "/advertising", label: "Advertising", icon: Megaphone },
  { href: "/affiliates", label: "Affiliates", icon: BarChart2 },
];

function CreditsBadge() {
  const { isAuthenticated } = useAuth();
  const { data: balance } = trpc.credits.balance.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  if (!isAuthenticated || !balance) return null;

  const isLow = balance.balance < 3 && balance.balance !== 99999;
  const displayBalance = balance.balance === 99999 ? "∞" : balance.balance;

  return (
    <Link href="/credits">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
          isLow
            ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25"
            : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
        )}
      >
        <Zap className="w-3 h-3" />
        <span>{displayBalance} credits</span>
        {balance.plan && balance.plan !== "free" && (
          <span className="ml-0.5 text-[9px] uppercase tracking-wide opacity-60">{balance.plan}</span>
        )}
      </div>
    </Link>
  );
}

function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30 * 1000, // poll every 30s
  });
  const { data: notifications, refetch: refetchList } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => { refetchCount(); refetchList(); } });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { refetchCount(); refetchList(); } });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated) return null;

  const unread = unreadData?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center justify-center rounded-lg transition-all",
          compact ? "w-8 h-8" : "w-9 h-9",
          open ? "bg-cyan-500/15 text-cyan-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
        )}
        aria-label="Notifications"
      >
        <Bell size={compact ? 15 : 17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/60 overflow-hidden",
          compact
            ? "right-0 top-10 w-80"
            : "left-0 bottom-12 w-80"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {!notifications || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-800/40",
                    !n.isRead && "bg-cyan-500/5 border-l-2 border-cyan-500/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold truncate", n.isRead ? "text-zinc-400" : "text-white")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-zinc-800">
            <Link href="/my-bookings" onClick={() => setOpen(false)}>
              <span className="text-xs text-cyan-400 hover:underline cursor-pointer">View all bookings →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = isAuthenticated ? authNavLinks : publicNavLinks;

  // When not authenticated, show a minimal public nav with only Login/Signup/Artist
  if (!isAuthenticated && !loading) {
    return (
      <>
        {/* Desktop minimal sidebar for logged-out users */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0 bg-zinc-950/95 border-r border-zinc-800/60 z-40 backdrop-blur-sm">
          <Link href="/login" className="flex items-center gap-3 px-4 py-4 group border-b border-zinc-800/60">
            <img src={LOGO_URL} alt="tatt-ooo" className="h-8 w-8 rounded-full object-cover ring-1 ring-cyan-500/30 group-hover:ring-cyan-500/60 transition-all" />
            <span className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>tatt-ooo</span>
          </Link>
          <nav className="flex flex-col gap-0.5 px-2 pt-3 flex-1">
            {publicNavLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg">
                  <Icon size={15} />{label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="flex flex-col items-center pb-4 pt-3 border-t border-zinc-800/40">
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Created by</p>
            <div className="bg-black rounded-xl p-2 shadow-lg shadow-black/60 flex items-center justify-center" style={{ minWidth: 80, minHeight: 80 }}>
              <LeegoLogo size={72} />
            </div>
          </div>
        </aside>

        {/* Mobile top bar for logged-out users */}
        <header className="md:hidden sticky top-0 z-50 w-full bg-zinc-950/95 border-b border-zinc-800/60 backdrop-blur-sm">
          <div className="flex items-center justify-between h-13 px-4 py-2">
            <Link href="/login" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="tatt-ooo" className="h-7 w-7 rounded-full object-cover ring-1 ring-cyan-500/30" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>tatt-ooo</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login"><Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white text-xs h-8">Sign In</Button></Link>
              <Link href="/signup"><Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-8">Sign Up</Button></Link>
            </div>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 h-screen sticky top-0 bg-zinc-950/95 border-r border-zinc-800/60 z-40 backdrop-blur-sm">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-4 py-4 group border-b border-zinc-800/60">
          <img
            src={LOGO_URL}
            alt="tatt-ooo"
            className="h-8 w-8 rounded-full object-cover ring-1 ring-cyan-500/30 group-hover:ring-cyan-500/60 transition-all"
          />
          <span
            className="text-base font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            tatt-ooo
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-2 pt-3 flex-1 overflow-y-auto">
          {visibleLinks.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href === "/signup" && location === "/login");
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2.5 h-9 text-sm transition-all rounded-lg",
                    active
                      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Admin links — only when authenticated admin */}
        {isAuthenticated && user?.role === "admin" && (
          <div className="px-2 pb-2">
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest px-2 mb-1">Admin</p>
            {adminNavLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2.5 h-9 text-sm transition-all rounded-lg",
                      active
                        ? "text-orange-400 bg-orange-500/10 border border-orange-500/20"
                        : "text-zinc-500 hover:text-orange-400 hover:bg-zinc-800/60"
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}

        {/* Credits + Notifications + Auth — only when authenticated */}
        <div className="px-2 py-3 border-t border-zinc-800/60 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1"><CreditsBadge /></div>
            <NotificationBell />
          </div>

          {isAuthenticated && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-zinc-500 px-2 truncate">
                {user?.name || user?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full justify-start gap-2 text-zinc-500 hover:text-white text-xs h-8"
              >
                <LogOut size={12} />
                Sign out
              </Button>
            </div>
          )}
        </div>

        {/* LEEGO creator logo — click to enlarge 2× for 3 seconds */}
        <div className="flex flex-col items-center pb-4 pt-3 border-t border-zinc-800/40">
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Created by</p>
          <div className="bg-black rounded-xl p-2 shadow-lg shadow-black/60 flex items-center justify-center" style={{ minWidth: 80, minHeight: 80 }}>
            <LeegoLogo size={72} />
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 w-full bg-zinc-950/95 border-b border-zinc-800/60 backdrop-blur-sm">
        <div className="flex items-center justify-between h-13 px-4 py-2">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src={LOGO_URL}
              alt="tatt-ooo"
              className="h-7 w-7 rounded-full object-cover ring-1 ring-cyan-500/30"
            />
            <span
              className="text-sm font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              tatt-ooo
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <CreditsBadge />
            <NotificationBell compact />
            <button
              className="p-1.5 text-zinc-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="bg-zinc-950/98 border-t border-zinc-800/60 px-3 pb-4 pt-2 flex flex-col gap-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 h-9 text-sm",
                      active
                        ? "text-cyan-400 bg-cyan-500/10"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </Button>
                </Link>
              );
            })}
            {/* Admin links on mobile */}
            {isAuthenticated && user?.role === "admin" && (
              <div className="pt-2 border-t border-zinc-800/60">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest px-2 mb-1">Admin</p>
                {adminNavLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-9 text-sm text-zinc-500 hover:text-orange-400 hover:bg-zinc-800/60"
                    >
                      <Icon size={14} />
                      {label}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800/60">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-zinc-400 hover:text-white h-9 text-sm"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut size={13} />
                  Sign out ({user?.name || user?.email})
                </Button>
              ) : null}
            </div>
            {/* Leego logo on mobile — click to enlarge 2× for 3 seconds */}
            <div className="flex flex-col items-center pt-2 border-t border-zinc-800/40">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Created by</p>
              <div className="bg-black rounded-xl p-1.5 shadow-lg shadow-black/60 flex items-center justify-center" style={{ minWidth: 56, minHeight: 56 }}>
                <LeegoLogo size={52} />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
