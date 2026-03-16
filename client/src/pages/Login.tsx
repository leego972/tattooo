import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sparkles, Eye, EyeOff } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Parse returnTo from query string
  const params = new URLSearchParams(search);
  const returnTo = params.get("returnTo") ? decodeURIComponent(params.get("returnTo")!) : "/studio";

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo);
    }
  }, [loading, user, navigate, returnTo]);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Welcome back!");
      navigate(returnTo);
    },
    onError: (err) => {
      toast.error(err.message || "Invalid email or password.");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Account created! You have 5 free credits to start.");
      navigate(returnTo);
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      if (!name.trim()) { toast.error("Please enter your name."); return; }
      if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
      if (!agreedToTerms) { toast.error("Please agree to the Terms & Conditions to continue."); return; }
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="tatt-ooo" className="w-20 h-20 rounded-full object-cover mb-3" />
          <h1 className="text-2xl font-bold text-white tracking-tight">tatt-ooo</h1>
          <p className="text-sm text-zinc-400 mt-1">AI Tattoo Designer</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
          {/* Tab switcher */}
          <div className="flex bg-zinc-800/60 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "login"
                  ? "bg-cyan-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "register"
                  ? "bg-cyan-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Your Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="flex items-start gap-3 py-1">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-cyan-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="terms-agree" className="text-xs text-zinc-400 leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    Terms & Conditions
                  </a>
                  {" "}and understand that AI-generated designs are for reference only. The quality of the final tattoo is the sole responsibility of the artist and client.
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || (mode === "register" && !agreedToTerms)}
              className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Account — 5 Free Credits
                </>
              )}
            </Button>
          </form>

          {mode === "register" && (
            <p className="text-xs text-zinc-500 text-center mt-4">
              New accounts receive <span className="text-cyan-400">5 free tattoo designs</span>. No credit card required.
            </p>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          <button onClick={() => navigate("/")} className="hover:text-zinc-300 transition-colors">
            ← Back to Home
          </button>
        </p>
      </div>
    </div>
  );
}
