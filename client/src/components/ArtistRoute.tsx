import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isAdminRole } from "@/const";

interface ArtistRouteProps {
  component: React.ComponentType;
}

/**
 * Route guard for artist-only pages.
 * - Unauthenticated users → /login
 * - Authenticated users with no artist profile → /studio
 * - Registered artists and admins → allowed through
 */
export default function ArtistRoute({ component: Component }: ArtistRouteProps) {
  const { user, loading: authLoading } = useAuth();

  const { data: artistProfile, isLoading: profileLoading } = trpc.artists.getMyProfile.useQuery(
    undefined,
    { enabled: !!user }
  );

  // While resolving auth or artist profile, show a spinner
  if (authLoading || (!!user && profileLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    return <Redirect to={`/login?returnTo=${returnTo}`} />;
  }

  // Admins always have access
  if (isAdminRole(user.role)) {
    return <Component />;
  }

  // No artist profile — redirect to studio
  if (!artistProfile) {
    return <Redirect to="/studio" />;
  }

  return <Component />;
}
