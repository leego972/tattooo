import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

/**
 * Wraps a page component and immediately redirects unauthenticated users to /login.
 * Uses <Redirect> (synchronous) instead of useEffect to prevent any flash of content.
 */
export default function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // While auth is resolving, show a minimal spinner — do NOT render the page
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — immediately redirect, no content rendered
  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    return <Redirect to={`/login?returnTo=${returnTo}`} />;
  }

  return <Component />;
}
