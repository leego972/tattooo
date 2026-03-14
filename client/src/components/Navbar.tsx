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
  ShieldCheck,
  BarChart2,
  Megaphone,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

const LEEGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/leego-logo_ad7e0c89.png";

const navLinks = [
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/my-tatts", label: "My Tatts", icon: BookMarked },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/draw", label: "Drawing Board", icon: PenTool },
  { href: "/history", label: "History", icon: Clock },
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/artists", label: "Find Artist", icon: Users },
  { href: "/referral", label: "Refer & Earn", icon: Gift },
  { href: "/artist-signup", label: "Join as Artist", icon: UserPlus },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

const adminNavLinks = [
  { href: "/admin", label: "Admin Panel", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Mail },
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
    <Link href="/pricing">
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
      </div>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────── */}
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
        <nav className="flex flex-col gap-0.5 px-2 pt-3 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = location === href;
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

        {/* Admin links */}
        {user?.role === "admin" && (
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

        {/* Credits + Auth */}
        <div className="px-2 py-3 border-t border-zinc-800/60 space-y-2">
          <CreditsBadge />

          {isAuthenticated ? (
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
          ) : (
            <Link href="/login" className="block">
              <Button
                size="sm"
                className="w-full gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs h-8"
              >
                <LogIn size={12} />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* LEEGO creator logo */}
        <div className="flex flex-col items-center pb-4 pt-2 border-t border-zinc-800/40">
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Created by</p>
          <img
            src={LEEGO_URL}
            alt="Created by LEEGO"
            className="w-24 h-24 object-contain opacity-70 hover:opacity-100 transition-opacity"
          />
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
            {navLinks.map(({ href, label, icon: Icon }) => {
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
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                  <Button className="w-full gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-9 text-sm">
                    <LogIn size={13} />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex flex-col items-center pt-2 border-t border-zinc-800/40">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Created by</p>
              <img
                src={LEEGO_URL}
                alt="Created by LEEGO"
                className="w-16 h-16 object-contain opacity-70"
              />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
