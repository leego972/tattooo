import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { isAdminRole } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, Zap, DollarSign, Palette, Shield, Send, Plus, RefreshCw,
  CheckCircle, XCircle, BarChart3, Mail, Globe, ChevronRight
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admins
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }
  if (!user) {
    setLocation("/login");
    return null;
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: userList } = trpc.admin.listUsers.useQuery({ limit: 50, offset: 0 });
  const { data: artistList } = trpc.admin.listArtists.useQuery();
  const { data: campaigns } = trpc.admin.listCampaigns.useQuery();

  const setRoleMut = trpc.admin.setUserRole.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      toast.success("Role updated");
    },
  });

  const adjustCreditsMut = trpc.admin.adjustCredits.useMutation({
    onSuccess: () => toast.success("Credits adjusted"),
  });

  const verifyArtistMut = trpc.admin.verifyArtist.useMutation({
    onSuccess: () => {
      utils.admin.listArtists.invalidate();
      toast.success("Artist status updated");
    },
  });

  const createCampaignMut = trpc.admin.createCampaign.useMutation({
    onSuccess: () => {
      utils.admin.listCampaigns.invalidate();
      toast.success("Campaign created with AI-generated email!");
    },
  });

  const sendCampaignMut = trpc.admin.sendCampaign.useMutation({
    onSuccess: (data) => {
      utils.admin.listCampaigns.invalidate();
      toast.success(`Sent ${data.sent} emails!`);
    },
  });

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    country: "",
    region: "",
    language: "en",
  });

  const [creditAdjust, setCreditAdjust] = useState<{ userId: number; amount: string; reason: string } | null>(null);

  // Gift Credits by email
  const [giftForm, setGiftForm] = useState({ email: "", amount: "50", reason: "Admin gift" });
  const [giftResult, setGiftResult] = useState<{ name: string | null; credited: number } | null>(null);
  const giftCreditsMut = trpc.admin.giftCredits.useMutation({
    onSuccess: (data) => {
      setGiftResult({ name: data.name, credited: data.credited });
      setGiftForm({ email: "", amount: "50", reason: "Admin gift" });
      toast.success(`Gifted ${data.credited} credits to ${data.name ?? data.userId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const statCards = [
    {
      title: "Total Users",
      value: statsLoading ? "..." : stats?.userCount ?? 0,
      icon: Users,
      color: "text-cyan-400",
    },
    {
      title: "Designs Generated",
      value: statsLoading ? "..." : stats?.genCount ?? 0,
      icon: Palette,
      color: "text-purple-400",
    },
    {
      title: "Artists Listed",
      value: statsLoading ? "..." : stats?.artistCount ?? 0,
      icon: Shield,
      color: "text-green-400",
    },
    {
      title: "Est. Revenue",
      value: statsLoading ? "..." : `$${stats?.estimatedRevenue ?? 0}`,
      icon: DollarSign,
      color: "text-yellow-400",
    },
  ];

  const LANGUAGES = [
    { code: "en", name: "English" }, { code: "fr", name: "French" },
    { code: "es", name: "Spanish" }, { code: "de", name: "German" },
    { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" }, { code: "ko", name: "Korean" },
    { code: "zh", name: "Mandarin" }, { code: "ar", name: "Arabic" },
    { code: "ru", name: "Russian" }, { code: "nl", name: "Dutch" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d0d0d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-xs text-white/40">tatt-ooo management panel</p>
            </div>
          </div>
          <a href="/" className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1">
            Back to App <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <Card key={card.title} className="bg-[#111] border-white/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40 uppercase tracking-wider">{card.title}</span>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-2xl font-bold text-white">{String(card.value)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-[#111] border border-white/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="artists" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Artists
            </TabsTrigger>
            <TabsTrigger value="outreach" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Outreach
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="gift" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Gift Credits
            </TabsTrigger>
          </TabsList>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/70">All Users ({userList?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Name</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Email</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Role</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Joined</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userList?.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">{u.name || "—"}</td>
                          <td className="py-2.5 px-3 text-white/60">{u.email}</td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant="outline"
                              className={isAdminRole(u.role) ? "border-cyan-500/50 text-cyan-400" : "border-white/20 text-white/50"}
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-white/40 text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-white/50 hover:text-white"
                                onClick={() => setRoleMut.mutate({
                                  userId: u.id,
                                  role: isAdminRole(u.role) ? "user" : "admin",
                                })}
                              >
                                {isAdminRole(u.role) ? "Demote" : "Make Admin"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-cyan-400/70 hover:text-cyan-400"
                                onClick={() => setCreditAdjust({ userId: u.id, amount: "50", reason: "Admin grant" })}
                              >
                                <Zap className="w-3 h-3 mr-1" /> Credits
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Credit adjustment dialog */}
                {creditAdjust && (
                  <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg border border-white/10">
                    <p className="text-sm text-white/70 mb-3">Adjust credits for user #{creditAdjust.userId}</p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={creditAdjust.amount}
                        onChange={(e) => setCreditAdjust({ ...creditAdjust, amount: e.target.value })}
                        className="bg-[#0d0d0d] border-white/10 text-white w-24"
                        placeholder="Amount"
                      />
                      <Input
                        value={creditAdjust.reason}
                        onChange={(e) => setCreditAdjust({ ...creditAdjust, reason: e.target.value })}
                        className="bg-[#0d0d0d] border-white/10 text-white flex-1"
                        placeholder="Reason"
                      />
                      <Button
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-black"
                        onClick={() => {
                          adjustCreditsMut.mutate({
                            userId: creditAdjust.userId,
                            amount: parseInt(creditAdjust.amount),
                            reason: creditAdjust.reason,
                          });
                          setCreditAdjust(null);
                        }}
                      >
                        Apply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setCreditAdjust(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Artists Tab ── */}
          <TabsContent value="artists">
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white/70">Artist Applications ({artistList?.length ?? 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Name</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Location</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Specialties</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Status</th>
                        <th className="text-left py-2 px-3 text-white/40 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {artistList?.map((a) => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">{a.name}</td>
                          <td className="py-2.5 px-3 text-white/60">{a.location || "—"}</td>
                          <td className="py-2.5 px-3 text-white/50 text-xs max-w-[200px] truncate">{a.specialties || "—"}</td>
                          <td className="py-2.5 px-3">
                            {a.verified ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 text-xs ${a.verified ? "text-red-400/70 hover:text-red-400" : "text-green-400/70 hover:text-green-400"}`}
                              onClick={() => verifyArtistMut.mutate({ artistId: a.id, verified: !a.verified })}
                            >
                              {a.verified ? (
                                <><XCircle className="w-3 h-3 mr-1" /> Unverify</>
                              ) : (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Verify</>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {(!artistList || artistList.length === 0) && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-white/30 text-sm">
                            No artists yet. They'll appear here when they apply.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Outreach Tab ── */}
          <TabsContent value="outreach">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Campaign */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" /> New AI Outreach Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Campaign Name</label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="e.g. Japan Artists Q1 2026"
                      className="bg-[#0d0d0d] border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Country</label>
                      <Input
                        value={newCampaign.country}
                        onChange={(e) => setNewCampaign({ ...newCampaign, country: e.target.value })}
                        placeholder="Japan"
                        className="bg-[#0d0d0d] border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Region (optional)</label>
                      <Input
                        value={newCampaign.region}
                        onChange={(e) => setNewCampaign({ ...newCampaign, region: e.target.value })}
                        placeholder="Tokyo"
                        className="bg-[#0d0d0d] border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Email Language</label>
                    <Select
                      value={newCampaign.language}
                      onValueChange={(v) => setNewCampaign({ ...newCampaign, language: v })}
                    >
                      <SelectTrigger className="bg-[#0d0d0d] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/10">
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.code} value={l.code} className="text-white">
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    disabled={!newCampaign.name || !newCampaign.country || createCampaignMut.isPending}
                    onClick={() => createCampaignMut.mutate(newCampaign)}
                  >
                    {createCampaignMut.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating AI Email...</>
                    ) : (
                      <><Globe className="w-4 h-4 mr-2" /> Generate AI Campaign</>
                    )}
                  </Button>
                  <p className="text-xs text-white/30 text-center">
                    AI will write a personalised email in {LANGUAGES.find(l => l.code === newCampaign.language)?.name || "English"}
                  </p>
                </CardContent>
              </Card>

              {/* Campaign List */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70">Campaigns ({campaigns?.length ?? 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {campaigns?.map((c) => (
                      <div key={c.id} className="p-3 bg-[#1a1a1a] rounded-lg border border-white/5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-medium text-white">{c.name}</p>
                            <p className="text-xs text-white/40">{c.country} · {c.language.toUpperCase()}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              c.status === "completed" ? "border-green-500/30 text-green-400" :
                              c.status === "sending" ? "border-yellow-500/30 text-yellow-400" :
                              "border-white/20 text-white/40"
                            }
                          >
                            {c.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                          <span><Send className="w-3 h-3 inline mr-1" />{c.sentCount} sent</span>
                          <span>👁 {c.openCount} opens</span>
                          <span>🖱 {c.clickCount} clicks</span>
                          <span>✅ {c.signupCount} signups</span>
                        </div>
                        {c.status === "draft" && (
                          <Button
                            size="sm"
                            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 h-7 text-xs"
                            disabled={sendCampaignMut.isPending}
                            onClick={() => sendCampaignMut.mutate({
                              campaignId: c.id,
                              origin: window.location.origin,
                            })}
                          >
                            <Send className="w-3 h-3 mr-1.5" /> Send Campaign
                          </Button>
                        )}
                      </div>
                    ))}
                    {(!campaigns || campaigns.length === 0) && (
                      <p className="text-center text-white/30 text-sm py-8">
                        No campaigns yet. Create your first outreach campaign above.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Styles */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70">Top Tattoo Styles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.topStyles?.slice(0, 8).map((s, i) => (
                      <div key={s.style} className="flex items-center gap-3">
                        <span className="text-xs text-white/30 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white/80">{s.style}</span>
                            <span className="text-xs text-white/40">{s.count}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                              style={{
                                width: `${Math.min(100, (Number(s.count) / (Number(stats.topStyles[0]?.count) || 1)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!stats?.topStyles || stats.topStyles.length === 0) && (
                      <p className="text-white/30 text-sm text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Credit Distribution */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white/70">Credit Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.creditDistribution?.map((d) => (
                      <div key={d.plan} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{d.plan}</p>
                          <p className="text-xs text-white/40">{d.count} users</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-cyan-400">{d.totalBalance?.toLocaleString() ?? 0}</p>
                          <p className="text-xs text-white/40">total credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Gift Credits Tab ── */}
          <TabsContent value="gift">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gift by Email */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" /> Gift Credits by Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">User Email</label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={giftForm.email}
                      onChange={(e) => setGiftForm({ ...giftForm, email: e.target.value })}
                      className="bg-[#0d0d0d] border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Amount</label>
                      <Input
                        type="number"
                        min="1" max="10000"
                        value={giftForm.amount}
                        onChange={(e) => setGiftForm({ ...giftForm, amount: e.target.value })}
                        className="bg-[#0d0d0d] border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Reason</label>
                      <Input
                        value={giftForm.reason}
                        onChange={(e) => setGiftForm({ ...giftForm, reason: e.target.value })}
                        className="bg-[#0d0d0d] border-white/10 text-white"
                        placeholder="Admin gift"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    disabled={!giftForm.email || !giftForm.amount || giftCreditsMut.isPending}
                    onClick={() => giftCreditsMut.mutate({
                      email: giftForm.email,
                      amount: parseInt(giftForm.amount),
                      reason: giftForm.reason,
                    })}
                  >
                    {giftCreditsMut.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Gift Credits
                  </Button>
                  {giftResult && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      <p className="text-sm text-green-300">
                        Gifted <strong>{giftResult.credited} credits</strong> to {giftResult.name ?? "user"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Gift Presets */}
              <Card className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">Quick Gift Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-white/40 mb-4">Enter an email above, then click a preset to fill the amount.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Support Fix", amount: 10, reason: "Support credit fix" },
                      { label: "Welcome Bonus", amount: 25, reason: "Welcome bonus" },
                      { label: "Loyalty Reward", amount: 50, reason: "Loyalty reward" },
                      { label: "Competition Prize", amount: 100, reason: "Competition prize" },
                      { label: "Influencer Gift", amount: 200, reason: "Influencer partnership" },
                      { label: "VIP Package", amount: 500, reason: "VIP gift package" },
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white/60 hover:text-white hover:border-cyan-500/50 bg-transparent text-xs justify-start"
                        onClick={() => setGiftForm({ ...giftForm, amount: String(preset.amount), reason: preset.reason })}
                      >
                        <Zap className="w-3 h-3 mr-1.5 text-cyan-400" />
                        {preset.label} ({preset.amount})
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
