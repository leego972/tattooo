import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

/**
 * Wraps a page component and redirects unauthenticated users to /login.
 * Shows a brief loading state while auth is being resolved.
 */
export default function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Preserve the intended destination so Login can redirect back after auth
      const returnTo = encodeURIComponent(location);
      setLocation(`/login?returnTo=${returnTo}`);
    }
  }, [loading, user, location, setLocation]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect is in progress via useEffect; render nothing
    return null;
  }

  return <Component />;
}
