import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mail, Send, Users, Globe, Trash2, Plus, Eye, RefreshCw,
  CheckCircle, AlertCircle, Clock, Ban, Loader2, Search,
  ChevronDown, ChevronUp, BarChart3, Megaphone, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_STATUS_CONFIG = {
  found:        { color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",  label: "Email Found",    icon: CheckCircle },
  not_found:    { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "No Email",       icon: AlertCircle },
  bounced:      { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       label: "Bounced",        icon: AlertCircle },
  unsubscribed: { color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/20",     label: "Unsubscribed",   icon: Ban },
};

const INFO_PACK_CONFIG = {
  not_sent: { color: "text-gray-400",  label: "Not Sent" },
  sent:     { color: "text-blue-400",  label: "Sent" },
  opened:   { color: "text-green-400", label: "Opened" },
  bounced:  { color: "text-red-400",   label: "Bounced" },
};

const LANG_NAMES: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", ja: "Japanese", ko: "Korean", nl: "Dutch", he: "Hebrew",
};

export default function MailingList() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }
  return <MailingListContent />;
}

function MailingListContent() {
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterEmailStatus, setFilterEmailStatus] = useState<string>("");
  const [filterInfoPack, setFilterInfoPack] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"contacts" | "send" | "preview">("contacts");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState<{ id: number; email: string } | null>(null);
  const [previewResult, setPreviewResult] = useState<{ subject: string; htmlBody: string; imageUrl?: string } | null>(null);
  const [previewLang, setPreviewLang] = useState("en");
  const [previewStudio, setPreviewStudio] = useState("Demo Studio");
  const [previewType, setPreviewType] = useState<"infopack" | "weekly">("infopack");
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [isSendingWeekly, setIsSendingWeekly] = useState(false);
  const [batchResult, setBatchResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

  const { data: contacts = [], refetch: refetchContacts, isLoading } = trpc.mailingList.list.useQuery({
    search: search || undefined,
    country: filterCountry || undefined,
    emailStatus: filterEmailStatus as "found" | "not_found" | "bounced" | "unsubscribed" | undefined,
    infoPackStatus: filterInfoPack as "not_sent" | "sent" | "opened" | "bounced" | undefined,
  });

  const { data: stats } = trpc.mailingList.stats.useQuery();

  const updateEmail = trpc.mailingList.updateEmail.useMutation({
    onSuccess: () => { toast.success("Updated"); refetchContacts(); setEditEmail(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteContact = trpc.mailingList.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetchContacts(); },
    onError: (e) => toast.error(e.message),
  });

  const sendInfoPack = trpc.mailingList.sendInfoPack.useMutation({
    onSuccess: (d) => { toast.success(`Info pack sent! Subject: ${d.subject}`); refetchContacts(); },
    onError: (e) => toast.error(e.message),
  });

  const sendInfoPackBatch = trpc.mailingList.sendInfoPackBatch.useMutation({
    onSuccess: (d) => {
      setBatchResult(d);
      toast.success(`Batch complete: ${d.sent} sent, ${d.failed} failed`);
      refetchContacts();
      setIsSendingBatch(false);
    },
    onError: (e) => { toast.error(e.message); setIsSendingBatch(false); },
  });

  const sendWeeklyAd = trpc.mailingList.sendWeeklyAd.useMutation({
    onSuccess: (d) => {
      setBatchResult(d);
      toast.success(`Weekly ad sent to ${d.sent} studios`);
      refetchContacts();
      setIsSendingWeekly(false);
    },
    onError: (e) => { toast.error(e.message); setIsSendingWeekly(false); },
  });

  const previewInfoPack = trpc.mailingList.previewInfoPack.useMutation({
    onSuccess: (d) => setPreviewResult(d),
    onError: (e) => toast.error(e.message),
  });

  const previewWeeklyAd = trpc.mailingList.previewWeeklyAd.useMutation({
    onSuccess: (d) => setPreviewResult(d),
    onError: (e) => toast.error(e.message),
  });

  const origin = window.location.origin;

  // Get unique countries for filter
  const countries = Array.from(new Set(contacts.map((c) => c.country))).sort();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-cyan-400" />
              Studio Mailing List
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage outreach to {stats?.total ?? 0} tattoo studios worldwide</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: "Total Studios", value: stats.total, icon: Users, color: "text-white" },
              { label: "Emails Found", value: stats.emailFound, icon: CheckCircle, color: "text-green-400" },
              { label: "No Email", value: stats.emailNotFound, icon: AlertCircle, color: "text-yellow-400" },
              { label: "Unsubscribed", value: stats.unsubscribed, icon: Ban, color: "text-gray-400" },
              { label: "Info Pack Sent", value: stats.infoPackSent, icon: Package, color: "text-blue-400" },
              { label: "Weekly Opt-Out", value: stats.weeklyOptOut, icon: Ban, color: "text-red-400" },
            ].map((s) => (
              <div key={s.label} className="bg-[#111] border border-[#222] rounded-xl p-4">
                <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
                <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#222]">
          {[
            { id: "contacts", label: "Contacts", icon: Users },
            { id: "send", label: "Send Campaigns", icon: Send },
            { id: "preview", label: "Preview Email", icon: Eye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search studio name, city, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#111] border-[#333] text-white"
                />
              </div>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="bg-[#111] border border-[#333] text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Countries</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterEmailStatus}
                onChange={(e) => setFilterEmailStatus(e.target.value)}
                className="bg-[#111] border border-[#333] text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Email Status</option>
                <option value="found">Email Found</option>
                <option value="not_found">No Email</option>
                <option value="bounced">Bounced</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
              <select
                value={filterInfoPack}
                onChange={(e) => setFilterInfoPack(e.target.value)}
                className="bg-[#111] border border-[#333] text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Info Pack Status</option>
                <option value="not_sent">Not Sent</option>
                <option value="sent">Sent</option>
                <option value="opened">Opened</option>
              </select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222] text-gray-400">
                      <th className="text-left px-4 py-3">Studio</th>
                      <th className="text-left px-4 py-3">Location</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Info Pack</th>
                      <th className="text-left px-4 py-3">Weekly Ads</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => {
                      const emailCfg = EMAIL_STATUS_CONFIG[c.emailStatus];
                      const infoCfg = INFO_PACK_CONFIG[c.infoPackStatus];
                      const isExpanded = expandedId === c.id;
                      return (
                        <>
                          <tr
                            key={c.id}
                            className={cn("border-b border-[#1a1a1a] hover:bg-[#161616] cursor-pointer", isExpanded && "bg-[#161616]")}
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{c.studioName}</div>
                              <div className="text-xs text-gray-500">{LANG_NAMES[c.language] || c.language}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-300">
                              {c.city ? `${c.city}, ` : ""}{c.country}
                            </td>
                            <td className="px-4 py-3">
                              {c.email ? (
                                <div>
                                  <span className={cn("text-xs font-medium", emailCfg.color)}>{c.email}</span>
                                </div>
                              ) : (
                                <span className={cn("text-xs", emailCfg.color)}>{emailCfg.label}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-xs font-medium", infoCfg.color)}>{infoCfg.label}</span>
                              {c.infoPackSentAt && (
                                <div className="text-xs text-gray-500">{new Date(c.infoPackSentAt).toLocaleDateString()}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {c.weeklyAdOptOut ? (
                                <span className="text-xs text-gray-500">Opted out</span>
                              ) : (
                                <span className="text-xs text-green-400">{c.weeklyAdSentCount} sent</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {c.email && c.emailStatus === "found" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300"
                                    onClick={() => sendInfoPack.mutate({ studioId: c.id, origin })}
                                    disabled={sendInfoPack.isPending}
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Info Pack
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                                  onClick={() => {
                                    if (confirm(`Delete ${c.studioName}?`)) deleteContact.mutate({ id: c.id });
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${c.id}-expanded`} className="bg-[#0f0f0f] border-b border-[#1a1a1a]">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="flex flex-wrap gap-4 items-end">
                                  <div className="flex-1 min-w-[200px]">
                                    <Label className="text-xs text-gray-400 mb-1">Update Email Address</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="email@studio.com"
                                        defaultValue={c.email ?? ""}
                                        onChange={(e) => setEditEmail({ id: c.id, email: e.target.value })}
                                        className="bg-[#111] border-[#333] text-white text-sm h-8"
                                      />
                                      <Button
                                        size="sm"
                                        className="h-8 bg-cyan-600 hover:bg-cyan-500"
                                        onClick={() => {
                                          if (editEmail?.id === c.id) {
                                            updateEmail.mutate({ id: c.id, email: editEmail.email });
                                          }
                                        }}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-400 mb-1">Email Status</Label>
                                    <select
                                      defaultValue={c.emailStatus}
                                      onChange={(e) => updateEmail.mutate({ id: c.id, emailStatus: e.target.value as "found" | "not_found" | "bounced" | "unsubscribed" })}
                                      className="bg-[#111] border border-[#333] text-white rounded-md px-3 py-1 text-sm h-8"
                                    >
                                      <option value="found">Found</option>
                                      <option value="not_found">Not Found</option>
                                      <option value="bounced">Bounced</option>
                                      <option value="unsubscribed">Unsubscribed</option>
                                    </select>
                                  </div>
                                  {c.notes && (
                                    <div className="text-xs text-gray-500 italic">{c.notes}</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-3 text-xs text-gray-500 border-t border-[#222]">
                  Showing {contacts.length} studios
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send Campaigns Tab */}
        {activeTab === "send" && (
          <div className="space-y-6">
            {/* Info Pack Batch */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Send Info Pack to All Studios
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Sends a personalised info pack email (in each studio's language) to all studios with emails that haven't received one yet.
                    Currently <strong className="text-white">{stats ? stats.emailFound - stats.infoPackSent : "..."}</strong> studios pending.
                  </p>
                </div>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-500"
                disabled={isSendingBatch}
                onClick={() => {
                  if (confirm("Send info pack to all eligible studios? This will send real emails.")) {
                    setIsSendingBatch(true);
                    setBatchResult(null);
                    sendInfoPackBatch.mutate({ origin });
                  }
                }}
              >
                {isSendingBatch ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Info Pack Batch</>}
              </Button>
            </div>

            {/* Weekly Ad */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-cyan-400" />
                    Send This Week's Ad
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Generates a fresh AI picture ad and sends it to all opted-in studios that haven't received this week's ad yet.
                    The AI generates unique copy in each studio's language.
                  </p>
                </div>
              </div>
              <Button
                className="bg-cyan-600 hover:bg-cyan-500"
                disabled={isSendingWeekly}
                onClick={() => {
                  if (confirm("Generate and send this week's ad to all eligible studios? This will send real emails.")) {
                    setIsSendingWeekly(true);
                    setBatchResult(null);
                    sendWeeklyAd.mutate({ origin });
                  }
                }}
              >
                {isSendingWeekly ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating & Sending...</> : <><Megaphone className="w-4 h-4 mr-2" /> Send Weekly Ad</>}
              </Button>
            </div>

            {/* Batch Result */}
            {batchResult && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  Send Results
                </h3>
                <div className="flex gap-6 mb-4">
                  <div><span className="text-2xl font-bold text-green-400">{batchResult.sent}</span><div className="text-xs text-gray-400">Sent</div></div>
                  <div><span className="text-2xl font-bold text-red-400">{batchResult.failed}</span><div className="text-xs text-gray-400">Failed</div></div>
                </div>
                {batchResult.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-red-400 font-medium mb-2">Errors:</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {batchResult.errors.map((e, i) => (
                        <div key={i} className="text-xs text-gray-400 bg-red-500/5 border border-red-500/10 rounded px-2 py-1">{e}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Preview Generated Email
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-gray-400 mb-1">Email Type</Label>
                  <select
                    value={previewType}
                    onChange={(e) => setPreviewType(e.target.value as "infopack" | "weekly")}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="infopack">Info Pack</option>
                    <option value="weekly">Weekly Ad</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1">Language</Label>
                  <select
                    value={previewLang}
                    onChange={(e) => setPreviewLang(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white rounded-md px-3 py-2 text-sm"
                  >
                    {Object.entries(LANG_NAMES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 mb-1">Studio Name</Label>
                  <Input
                    value={previewStudio}
                    onChange={(e) => setPreviewStudio(e.target.value)}
                    className="bg-[#0a0a0a] border-[#333] text-white"
                  />
                </div>
              </div>
              <Button
                className="bg-cyan-600 hover:bg-cyan-500"
                disabled={previewInfoPack.isPending || previewWeeklyAd.isPending}
                onClick={() => {
                  setPreviewResult(null);
                  if (previewType === "infopack") {
                    previewInfoPack.mutate({ language: previewLang, studioName: previewStudio, origin });
                  } else {
                    previewWeeklyAd.mutate({ language: previewLang, studioName: previewStudio, origin });
                  }
                }}
              >
                {(previewInfoPack.isPending || previewWeeklyAd.isPending)
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  : <><Eye className="w-4 h-4 mr-2" /> Generate Preview</>}
              </Button>
            </div>

            {previewResult && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-6">
                <div className="mb-3">
                  <span className="text-xs text-gray-400">Subject: </span>
                  <span className="text-white font-medium">{previewResult.subject}</span>
                </div>
                {previewResult.imageUrl && (
                  <img src={previewResult.imageUrl} alt="Ad" className="max-w-sm rounded-lg border border-[#333] mb-4" />
                )}
                <div
                  className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewResult.htmlBody }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
