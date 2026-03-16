import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Megaphone, TrendingUp, Eye, MousePointer, DollarSign,
  Play, Pause, Plus, RefreshCw, Image as ImageIcon, BarChart2
} from "lucide-react";
import { useLocation } from "wouter";

// Ad creatives registered in the system
const AD_CREATIVES = [
  {
    id: "portrait-1",
    title: "Design Your Dream Tattoo with AI",
    format: "Portrait",
    cta: "Find Your Perfect Artist",
    url: "",
    channel: "Instagram / TikTok",
  },
  {
    id: "portrait-2",
    title: "Get Inked by Top Local Artists",
    format: "Portrait",
    cta: "Join the #1 Tattoo Platform",
    url: "",
    channel: "Instagram / TikTok",
  },
  {
    id: "portrait-3",
    title: "Create & Book Your Tattoo in One Place!",
    format: "Portrait",
    cta: "Find Your Artist",
    url: "",
    channel: "Instagram / TikTok",
  },
  {
    id: "landscape-1",
    title: "Design Your Tattoo Ideas with AI",
    format: "Landscape",
    cta: "Start Now",
    url: "",
    channel: "Facebook / Google Display",
  },
  {
    id: "landscape-2",
    title: "AI Designs Your Tattoo",
    format: "Landscape",
    cta: "Get Inked Today",
    url: "",
    channel: "Facebook / Google Display",
  },
  {
    id: "landscape-3",
    title: "Create Your Dream Tattoo with AI",
    format: "Landscape",
    cta: "Get Inked Today",
    url: "",
    channel: "Facebook / Google Display",
  },
  {
    id: "landscape-4",
    title: "Design & Book Your Tattoo in One Place!",
    format: "Landscape",
    cta: "Start Now",
    url: "",
    channel: "Facebook / Google Display",
  },
];

const CHANNELS = [
  { id: "instagram", name: "Instagram", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { id: "tiktok", name: "TikTok", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "facebook", name: "Facebook", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "google", name: "Google Ads", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "twitter", name: "X / Twitter", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  { id: "pinterest", name: "Pinterest", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export default function AdvertisingDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "creatives" | "campaigns" | "channels">("overview");
  const [generatingContent, setGeneratingContent] = useState<string | null>(null);

  const { data: dashboard, refetch: refetchDashboard } = trpc.advertising.getDashboard.useQuery();
  const { data: contentQueue, refetch: refetchQueue } = trpc.advertising.getContentQueue.useQuery({ status: "draft", limit: 20 });

  const generateContent = trpc.advertising.triggerTikTokPost.useMutation({
    onSuccess: () => {
      toast.success(`Content generation triggered for ${generatingContent}`);
      setGeneratingContent(null);
      refetchQueue();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate content");
      setGeneratingContent(null);
    },
  });

  const runOrchestrator = trpc.advertising.runCycle.useMutation({
    onSuccess: () => {
      toast.success("Advertising cycle ran successfully");
      refetchDashboard();
    },
    onError: (err: any) => toast.error(err.message || "Orchestrator failed"),
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
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
            <Megaphone className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">Advertising Dashboard</h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">tatooo.shop</Badge>
          </div>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            onClick={() => runOrchestrator.mutate()}
            disabled={runOrchestrator.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runOrchestrator.isPending ? "animate-spin" : ""}`} />
            Run Orchestrator
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: "overview", label: "Overview", icon: BarChart2 },
            { id: "creatives", label: "Ad Creatives", icon: ImageIcon },
            { id: "campaigns", label: "Campaigns", icon: Megaphone },
            { id: "channels", label: "Channels", icon: TrendingUp },
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Budget", value: `$${((dashboard?.strategy?.monthlyBudget || 0)).toLocaleString()}`, icon: DollarSign, color: "text-amber-400" },
                { label: "Free Channels", value: String(dashboard?.strategy?.freeChannelCount || 0), icon: TrendingUp, color: "text-green-400" },
                { label: "Content Queue", value: String(contentQueue?.length || 0), icon: Eye, color: "text-blue-400" },
                { label: "A/B Tests", value: String(dashboard?.abTests?.length || 0), icon: MousePointer, color: "text-purple-400" },
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

            {/* Content Generation */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Generate AI Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Generate platform-specific ad copy, captions, and hashtags using AI for tatooo.shop.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CHANNELS.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="outline"
                      className={`border ${channel.color} hover:opacity-80`}
                      onClick={() => {
                        setGeneratingContent(channel.name);
                        generateContent.mutate();
                      }}
                      disabled={!!generatingContent}
                    >
                      {generatingContent === channel.name ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {channel.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ad Creatives Tab */}
        {activeTab === "creatives" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Ad Creatives Library</h2>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {AD_CREATIVES.length} creatives ready
              </Badge>
            </div>

            {/* Portrait creatives */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Portrait Format (Instagram / TikTok)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AD_CREATIVES.filter(c => c.format === "Portrait").map((creative) => (
                  <Card key={creative.id} className="bg-gray-900/50 border-gray-800 overflow-hidden group">
                    <div className="aspect-[9/16] bg-gray-800 relative overflow-hidden">
                      <img
                        src={creative.url}
                        alt={creative.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-bold leading-tight">{creative.title}</p>
                        <p className="text-amber-400 text-xs mt-1">{creative.cta}</p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
                          {creative.channel}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2">
                          <Play className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Landscape creatives */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Landscape Format (Facebook / Google Display)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AD_CREATIVES.filter(c => c.format === "Landscape").map((creative) => (
                  <Card key={creative.id} className="bg-gray-900/50 border-gray-800 overflow-hidden group">
                    <div className="aspect-video bg-gray-800 relative overflow-hidden">
                      <img
                        src={creative.url}
                        alt={creative.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-bold leading-tight">{creative.title}</p>
                        <p className="text-amber-400 text-xs mt-1">{creative.cta}</p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {creative.channel}
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2">
                          <Play className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Content Queue</h2>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold" size="sm" onClick={() => runOrchestrator.mutate()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Cycle
              </Button>
            </div>

            {contentQueue && contentQueue.length > 0 ? (
              <div className="space-y-3">
                {contentQueue.map((campaign: any) => (
                  <Card key={campaign.id} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{campaign.name}</h3>
                          <p className="text-gray-400 text-sm">{campaign.platform}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Impressions</div>
                            <div className="font-bold text-white">{campaign.impressions?.toLocaleString() || 0}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Clicks</div>
                            <div className="font-bold text-green-400">{campaign.clicks?.toLocaleString() || 0}</div>
                          </div>
                          <Badge
                            className={
                              campaign.status === "active"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-gray-400">
                            {campaign.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No campaigns yet. Create your first campaign above.</p>
              </div>
            )}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Marketing Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHANNELS.map((channel) => (
                <Card key={channel.id} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`border ${channel.color}`}>{channel.name}</Badge>
                      <Button
                        size="sm"
                        className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                        onClick={() => {
                          setGeneratingContent(channel.name);
                          generateContent.mutate();
                        }}
                        disabled={!!generatingContent}
                      >
                        {generatingContent === channel.name ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3 mr-1" />
                        )}
                        Generate
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Ad Creatives</span>
                        <span className="text-white font-medium">
                          {AD_CREATIVES.filter(c =>
                            c.channel.toLowerCase().includes(channel.name.toLowerCase().split(" ")[0])
                          ).length} ready
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target Audience</span>
                        <span className="text-white font-medium">Tattoo Enthusiasts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="text-green-400 font-medium">Ready</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
