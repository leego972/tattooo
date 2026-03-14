import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Sparkles, Images, Clock, LogOut, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

const LEEGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/leego-logo_ad7e0c89.png";

const navLinks = [
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/history", label: "History", icon: Clock },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 glass border-r border-border/40 z-40">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-5 py-5 group border-b border-border/30">
          <img
            src={LOGO_URL}
            alt="tatt-ooo"
            className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all"
          />
          <span
            className="text-lg font-bold gradient-text"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            tatt-ooo
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 pt-4 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 text-sm transition-all",
                    active
                      ? "text-primary bg-primary/10 border border-primary/20 glow-ink"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        <div className="px-3 py-3 border-t border-border/30">
          {isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground px-2 truncate">
                {user?.name || user?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { logout(); }}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground text-xs"
              >
                <LogOut size={13} />
                Sign out
              </Button>
            </div>
          ) : (
            <a href={getLoginUrl()} className="block">
              <Button
                size="sm"
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-ink text-xs"
              >
                <LogIn size={13} />
                Sign in
              </Button>
            </a>
          )}
        </div>

        {/* LEEGO creator logo — bottom of sidebar, double size */}
        <div className="flex flex-col items-center pb-4 pt-2 border-t border-border/20">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1">Created by</p>
          <img
            src={LEEGO_URL}
            alt="Created by LEEGO"
            className="w-28 h-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-50 w-full glass border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src={LOGO_URL}
              alt="tatt-ooo"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/30"
            />
            <span
              className="text-base font-bold gradient-text"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              tatt-ooo
            </span>
          </Link>

          <button
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="glass border-t border-border/50 px-4 pb-5 pt-2 flex flex-col gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2",
                      active ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </Button>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-border/50">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => { void logout(); setMobileOpen(false); }}
                >
                  <LogOut size={14} />
                  Sign out
                </Button>
              ) : (
                <a href={getLoginUrl()} className="block">
                  <Button className="w-full gap-2 bg-primary text-primary-foreground">
                    <LogIn size={14} />
                    Sign in
                  </Button>
                </a>
              )}
            </div>

            {/* LEEGO logo in mobile menu too */}
            <div className="flex flex-col items-center pt-3 border-t border-border/20">
              <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-1">Created by</p>
              <img
                src={LEEGO_URL}
                alt="Created by LEEGO"
                className="w-20 h-20 object-contain opacity-80"
              />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
