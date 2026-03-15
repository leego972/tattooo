import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Zap,
  TrendingUp,
  ShoppingCart,
  Minus,
  Gift,
  RefreshCw,
  Crown,
  ArrowUpRight,
  Loader2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; sign: "+" | "-" }
> = {
  free_grant: { label: "Welcome Gift", icon: Gift, color: "text-emerald-400", sign: "+" },
  purchase:   { label: "Purchase",     icon: ShoppingCart, color: "text-cyan-400",    sign: "+" },
  subscription: { label: "Subscription", icon: Crown, color: "text-violet-400",  sign: "+" },
  referral:   { label: "Referral",     icon: Gift, color: "text-amber-400",   sign: "+" },
  refund:     { label: "Refund",       icon: RefreshCw, color: "text-emerald-400", sign: "+" },
  deduction:  { label: "Used",         icon: Minus, color: "text-zinc-500",    sign: "-" },
};

const PLAN_COLORS: Record<string, string> = {
  free:      "bg-zinc-700/40 text-zinc-300",
  starter:   "bg-blue-500/20 text-blue-300",
  pro:       "bg-violet-500/20 text-violet-300",
  studio:    "bg-amber-500/20 text-amber-300",
  unlimited: "bg-cyan-500/20 text-cyan-300",
};

export default function Credits() {
  const { isAuthenticated } = useAuth();
  const { data: balance, isLoading: balanceLoading } = trpc.credits.balance.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: transactions, isLoading: txLoading } = trpc.credits.transactions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <Zap className="w-12 h-12 text-cyan-500/50" />
        <h2 className="text-xl font-semibold text-white">Sign in to view your credits</h2>
        <Link href="/login">
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">Sign In</Button>
        </Link>
      </div>
    );
  }

  const displayBalance = balance?.balance === 99999 ? "∞" : (balance?.balance ?? 0);
  const plan = balance?.plan ?? "free";
  const isLow = typeof balance?.balance === "number" && balance.balance < 5 && balance.balance !== 99999;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
          Credits
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Your balance, plan, and transaction history.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Balance card */}
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {balanceLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            ) : (
              <>
                <p className={cn("text-3xl font-bold", isLow ? "text-orange-400" : "text-cyan-400")}>
                  {displayBalance}
                </p>
                {isLow && (
                  <p className="text-xs text-orange-400/80 mt-1">Running low</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan card */}
        <Card className="bg-zinc-900/80 border-zinc-800/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-zinc-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {balanceLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            ) : (
              <div className="flex flex-col gap-2">
                <Badge className={cn("w-fit text-xs capitalize font-semibold", PLAN_COLORS[plan] ?? PLAN_COLORS.free)}>
                  {plan}
                </Badge>
                {plan === "free" ? (
                  <Link href="/subscription">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-1">
                      Upgrade <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1"
                    disabled={createPortal.isPending}
                    onClick={() => createPortal.mutate({ origin: window.location.origin })}
                  >
                    {createPortal.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                    Manage
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lifetime total */}
      {balance && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
          <TrendingUp className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400">
            Lifetime credits earned:{" "}
            <span className="text-white font-semibold">{balance.lifetimeTotal ?? 0}</span>
          </span>
          <div className="ml-auto">
            <Link href="/pricing">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-cyan-400 hover:bg-cyan-500/10 gap-1">
                Buy more <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Transaction History</h2>

        {txLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <Zap className="w-8 h-8 text-zinc-700" />
            <p className="text-zinc-500 text-sm">No transactions yet.</p>
            <Link href="/studio">
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                Start Designing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx) => {
              const meta = TYPE_META[tx.type] ?? TYPE_META.deduction;
              const Icon = meta.icon;
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-colors"
                >
                  <div className={cn("p-1.5 rounded-md bg-zinc-800/60", meta.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{tx.description || meta.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      isPositive ? "text-emerald-400" : "text-zinc-500"
                    )}
                  >
                    {isPositive ? "+" : ""}{tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
