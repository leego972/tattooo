import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Gift, Users, Zap, Share2, Twitter, MessageCircle } from "lucide-react";

export default function Referral() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <ReferralContent />;
}

function ReferralContent() {
  const [copied, setCopied] = useState(false);

  const { data: codeData } = trpc.referral.getMyCode.useQuery();
  const { data: stats } = trpc.referral.getStats.useQuery();

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
      "I've been using tatt-ooo to design my tattoos with AI 🔥 Get 5 free credits when you sign up: "
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(refUrl)}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out tatt-ooo — AI tattoo designer! Get 5 free credits: ${refUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Refer a Friend</h1>
          <p className="text-white/50 text-lg">
            Give 5 credits, get 5 credits. Share the ink love.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Share2, step: "1", title: "Share your link", desc: "Send your unique referral link to friends" },
            { icon: Users, step: "2", title: "They sign up", desc: "Your friend creates a tatt-ooo account" },
            { icon: Zap, step: "3", title: "Both get 5 credits", desc: "You and your friend each receive 5 free credits" },
          ].map((item) => (
            <div key={item.step} className="text-center p-4 bg-[#111] rounded-xl border border-white/10">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-xs font-bold text-cyan-400 mb-1">STEP {item.step}</p>
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        <Card className="bg-[#111] border-white/10 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white/70">Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={refUrl}
                readOnly
                className="bg-[#0d0d0d] border-white/10 text-white/70 text-sm font-mono"
              />
              <Button
                onClick={copyLink}
                className={`shrink-0 ${copied ? "bg-green-500 hover:bg-green-600" : "bg-cyan-500 hover:bg-cyan-600"} text-black font-semibold`}
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/70 hover:text-white hover:border-white/30"
                onClick={shareTwitter}
              >
                <Twitter className="w-4 h-4 mr-2" /> Share on X
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/70 hover:text-white hover:border-white/30"
                onClick={shareWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">
                {stats?.completedReferrals ?? 0}
              </div>
              <p className="text-sm text-white/50">Friends Joined</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats?.creditsEarned ?? 0}
              </div>
              <p className="text-sm text-white/50">Credits Earned</p>
            </CardContent>
          </Card>
        </div>

        {stats && stats.pendingReferrals > 0 && (
          <p className="text-center text-sm text-white/30 mt-4">
            {stats.pendingReferrals} pending referral{stats.pendingReferrals > 1 ? "s" : ""} — credits awarded when they sign up
          </p>
        )}
      </div>
    </div>
  );
}
