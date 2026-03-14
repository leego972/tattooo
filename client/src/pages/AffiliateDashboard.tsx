import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users, TrendingUp, DollarSign, Search, Plus,
  RefreshCw, CheckCircle, XCircle, Clock, ExternalLink
} from "lucide-react";
import { useLocation } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  discovered: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "partners" | "discovery" | "payouts">("overview");

  const { data: stats } = trpc.affiliate.getStats.useQuery();
  const { data: partners, refetch: refetchPartners } = trpc.affiliate.listPartners.useQuery({});
  const { data: discoveries, refetch: refetchDiscoveries } = trpc.affiliate.listDiscoveries.useQuery({});
  const { data: discoveryStats } = trpc.affiliate.getDiscoveryStats.useQuery();

  const seedPrograms = trpc.affiliate.seedPrograms.useMutation({
    onSuccess: () => {
      toast.success("Tattoo affiliate programs seeded successfully");
      refetchPartners();
    },
    onError: (err: any) => toast.error(err.message || "Failed to seed programs"),
  });

  const runDiscovery = trpc.affiliate.runDiscovery.useMutation({
    onSuccess: () => {
      toast.success("Discovery run started — checking for new tattoo affiliates");
      refetchDiscoveries();
    },
    onError: (err: any) => toast.error(err.message || "Discovery failed"),
  });

  const generateBulkOutreach = trpc.affiliate.generateBulkOutreach.useMutation({
    onSuccess: () => toast.success("Bulk outreach emails generated for all pending partners"),
    onError: (err: any) => toast.error(err.message || "Failed to generate outreach"),
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Admin access required</p>
          <Button className="mt-4" onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">Affiliate Dashboard</h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">tatooo.shop</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => seedPrograms.mutate()}
              disabled={seedPrograms.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Seed Programs
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              onClick={() => runDiscovery.mutate()}
              disabled={runDiscovery.isPending}
            >
              <Search className={`w-4 h-4 mr-2 ${runDiscovery.isPending ? "animate-spin" : ""}`} />
              Run Discovery
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "partners", label: "Partners", icon: Users },
            { id: "discovery", label: "Discovery", icon: Search },
            { id: "payouts", label: "Payouts", icon: DollarSign },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Partners", value: String(stats?.totalPartners || 0), icon: Users, color: "text-blue-400" },
                { label: "Active Partners", value: String(stats?.activePartners || 0), icon: CheckCircle, color: "text-green-400" },
                { label: "Total Referrals", value: String(stats?.totalReferrals || 0), icon: TrendingUp, color: "text-amber-400" },
                { label: "Total Earnings", value: `$${((stats?.totalEarningsCents || 0) / 100).toFixed(2)}`, icon: DollarSign, color: "text-purple-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">{label}</span>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Discovery Stats */}
            {discoveryStats && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Discovery Engine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Discovered</div>
                      <div className="text-white font-bold text-lg">{(discoveryStats as any).total || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Contacted</div>
                      <div className="text-amber-400 font-bold text-lg">{(discoveryStats as any).contacted || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Converted</div>
                      <div className="text-green-400 font-bold text-lg">{(discoveryStats as any).active || 0}</div>
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                    size="sm"
                    onClick={() => generateBulkOutreach.mutate()}
                    disabled={generateBulkOutreach.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateBulkOutreach.isPending ? "animate-spin" : ""}`} />
                    Generate Bulk Outreach Emails
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === "partners" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Affiliate Partners</h2>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {partners?.length || 0} partners
              </Badge>
            </div>

            {partners && partners.length > 0 ? (
              <div className="space-y-3">
                {partners.map((partner: any) => (
                  <Card key={partner.id} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <span className="text-amber-400 font-bold text-sm">
                              {(partner.name || "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{partner.name}</h3>
                            <p className="text-gray-400 text-sm">{partner.email}</p>
                            {partner.website && (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 text-xs flex items-center gap-1 hover:underline"
                              >
                                {partner.website} <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Commission</div>
                            <div className="text-amber-400 font-bold">{partner.commissionRate}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Referrals</div>
                            <div className="text-white font-bold">{partner.totalReferrals}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Earnings</div>
                            <div className="text-green-400 font-bold">
                              ${((partner.totalEarningsCents || 0) / 100).toFixed(2)}
                            </div>
                          </div>
                          <Badge className={`border ${STATUS_COLORS[partner.status] || STATUS_COLORS.pending}`}>
                            {partner.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="mb-4">No affiliate partners yet.</p>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  onClick={() => seedPrograms.mutate()}
                  disabled={seedPrograms.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Seed Tattoo Affiliate Programs
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Discovery Tab */}
        {activeTab === "discovery" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Discovered Prospects</h2>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                size="sm"
                onClick={() => runDiscovery.mutate()}
                disabled={runDiscovery.isPending}
              >
                <Search className={`w-4 h-4 mr-2 ${runDiscovery.isPending ? "animate-spin" : ""}`} />
                Run Discovery
              </Button>
            </div>

            {discoveries && discoveries.length > 0 ? (
              <div className="space-y-3">
                {discoveries.map((d: any) => (
                  <Card key={d.id} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{d.name || d.url}</h3>
                          {d.email && <p className="text-gray-400 text-sm">{d.email}</p>}
                          <p className="text-gray-500 text-xs">{d.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Score</div>
                            <div className="text-amber-400 font-bold">{d.score}/100</div>
                          </div>
                          <Badge className={`border ${STATUS_COLORS[d.status] || STATUS_COLORS.discovered}`}>
                            {d.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No discoveries yet. Run the discovery engine to find tattoo affiliates.</p>
              </div>
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Payout Ledger</h2>
            <div className="text-center py-16 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No payouts processed yet.</p>
              <p className="text-sm mt-2">Payouts are processed when affiliate partners reach the minimum threshold.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
