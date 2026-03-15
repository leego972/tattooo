import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Copy,
  Gift,
  Users,
  Zap,
  Share2,
  Twitter,
  MessageCircle,
  Trophy,
  CheckCircle2,
  Ticket,
  ArrowLeft,
} from "lucide-react";

export default function Referral() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }
  return <ReferralContent />;
}

function ReferralContent() {
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const { data: codeData, isLoading: codeLoading } = trpc.referral.getMyCode.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.referral.getStats.useQuery();
  const { data: promoValidation } = trpc.promo.validate.useQuery(
    { code: promoCode },
    { enabled: promoCode.length >= 3 }
  );

  const applyPromoMutation = trpc.promo.applyCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setPromoApplied(true);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const refUrl = codeData?.refCode
    ? `${window.location.origin}/signup?ref=${codeData.refCode}`
    : "";

  const copyLink = async () => {
    if (!refUrl) return;
    await navigator.clipboard.writeText(refUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      "I've been designing tattoos with AI on tatt-ooo 🔥 Get 10 free credits when you sign up: "
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(refUrl)}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Design your tattoo with AI on tatt-ooo! Get 10 free credits when you sign up: ${refUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const milestones = stats?.milestones ?? [];
  const successfulReferrals = stats?.successfulReferrals ?? 0;
  const nextMilestone = stats?.nextMilestone;

  const progressToNext = nextMilestone
    ? Math.min((successfulReferrals / nextMilestone.count) * 100, 100)
    : 100;

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    applyPromoMutation.mutate({ code: promoCode.trim() });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Referral Programme</h1>
            <p className="text-xs text-muted-foreground">Earn credits by inviting friends</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-black border border-violet-500/30 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.3),transparent_70%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium uppercase tracking-wider">Earn Together</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Give 10 credits, Get 10 credits
            </h2>
            <p className="text-violet-200/80 text-sm md:text-base max-w-lg">
              Share your unique link. When a friend signs up, you both get <strong className="text-white">10 free credits</strong> to generate tattoo designs. Hit milestones for massive bonus rewards.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-violet-400">
                {statsLoading ? "—" : (stats?.totalReferrals ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Referrals</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {statsLoading ? "—" : (stats?.successfulReferrals ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Successful</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {statsLoading ? "—" : (stats?.creditsEarned ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Credits Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-violet-400" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link to earn credits when friends sign up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {codeLoading ? (
              <div className="h-10 bg-muted/30 rounded-lg animate-pulse" />
            ) : (
              <div className="flex gap-2">
                <Input
                  value={refUrl}
                  readOnly
                  className="bg-muted/30 text-sm font-mono text-muted-foreground"
                />
                <Button onClick={copyLink} variant="outline" className="shrink-0 gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={shareTwitter}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                disabled={!refUrl}
              >
                <Twitter className="w-4 h-4" />
                Share on X
              </Button>
              <Button
                onClick={shareWhatsApp}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                disabled={!refUrl}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
            {codeData?.refCode && (
              <p className="text-xs text-muted-foreground text-center">
                Your code: <span className="font-mono font-bold text-violet-400">{codeData.refCode}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Milestone Progress */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Milestone Rewards
            </CardTitle>
            <CardDescription>Hit referral milestones for massive bonus credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextMilestone && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Progress to <strong className="text-foreground">{nextMilestone.label}</strong>
                  </span>
                  <span className="text-violet-400 font-medium">
                    {successfulReferrals} / {nextMilestone.count}
                  </span>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {nextMilestone.count - successfulReferrals} more referral
                  {nextMilestone.count - successfulReferrals !== 1 ? "s" : ""} to unlock{" "}
                  <strong className="text-amber-400">+{nextMilestone.bonus} bonus credits</strong>
                </p>
              </div>
            )}
            <div className="space-y-2">
              {milestones.map((m) => {
                const reached = successfulReferrals >= m.count;
                return (
                  <div
                    key={m.count}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      reached
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-muted/20 border-border/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {reached ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.count} successful referrals</div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        reached
                          ? "border-green-500/50 text-green-400"
                          : "border-amber-500/30 text-amber-400"
                      }
                    >
                      +{m.bonus} credits
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Section */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ticket className="w-4 h-4 text-pink-400" />
              Promo Code
            </CardTitle>
            <CardDescription>Apply a promo code for a discount on your next purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promoApplied ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-400">Promo code applied!</p>
                  <p className="text-xs text-muted-foreground">Your discount will be applied at checkout.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code (e.g. TATTOO50)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="bg-muted/30 font-mono uppercase"
                    maxLength={32}
                  />
                  <Button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim() || applyPromoMutation.isPending}
                    className="shrink-0 bg-violet-600 hover:bg-violet-700"
                  >
                    {applyPromoMutation.isPending ? "Applying..." : "Apply"}
                  </Button>
                </div>
                {promoCode.length >= 3 && promoValidation && (
                  <div
                    className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                      promoValidation.valid
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {promoValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Valid! <strong>{promoValidation.discountPercent}% off</strong>
                          {(promoValidation.bonusCredits ?? 0) > 0 &&
                            ` + ${promoValidation.bonusCredits} bonus credits`}
                          {promoValidation.description && ` — ${promoValidation.description}`}
                        </span>
                      </>
                    ) : (
                      <span>✗ Invalid or expired code</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Try:{" "}
                  <button
                    onClick={() => setPromoCode("TATTOO50")}
                    className="text-violet-400 hover:underline font-mono"
                  >
                    TATTOO50
                  </button>
                  ,{" "}
                  <button
                    onClick={() => setPromoCode("WELCOME25")}
                    className="text-violet-400 hover:underline font-mono"
                  >
                    WELCOME25
                  </button>
                  ,{" "}
                  <button
                    onClick={() => setPromoCode("INKED2025")}
                    className="text-violet-400 hover:underline font-mono"
                  >
                    INKED2025
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Recent Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentReferrals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          r.status === "rewarded" ? "bg-green-400" : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium capitalize">{r.status}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                        </div>
                      </div>
                    </div>
                    {r.rewardAmount && (
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        +{r.rewardAmount} credits
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Share your link",
                  desc: "Copy your unique referral link and share it with friends.",
                },
                {
                  step: "2",
                  title: "Friend signs up",
                  desc: "They create a free account using your link.",
                },
                {
                  step: "3",
                  title: "Both earn credits",
                  desc: "You both get 10 free credits to generate tattoo designs.",
                },
                {
                  step: "4",
                  title: "Hit milestones",
                  desc: "Refer more friends to unlock massive bonus credit rewards.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-violet-400">{item.step}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
