import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mail,
  Plus,
  Send,
  Users,
  Globe,
  BarChart3,
  Eye,
  MousePointer,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
  Sparkles,
  CheckCircle,
  Clock,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese (Mandarin)" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "sv", label: "Swedish" },
  { code: "tr", label: "Turkish" },
  { code: "hi", label: "Hindi" },
];

const STATUS_CONFIG = {
  draft: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Draft" },
  scheduled: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Scheduled" },
  sending: { icon: Loader2, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Sending" },
  completed: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "Completed" },
  paused: { icon: Pause, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "Paused" },
};

export default function Outreach() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  return <OutreachContent />;
}

function OutreachContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    country: "",
    region: "",
    language: "en",
  });
  const [contactsText, setContactsText] = useState("");
  const [expandedPreview, setExpandedPreview] = useState<number | null>(null);

  const { data: campaigns, refetch: refetchCampaigns } = trpc.admin.listCampaigns.useQuery();

  const createMutation = trpc.admin.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign created with AI-generated email!");
      setShowCreate(false);
      setCreateForm({ name: "", country: "", region: "", language: "en" });
      void refetchCampaigns();
    },
    onError: (err) => toast.error(err.message || "Failed to create campaign"),
  });

  const addContactsMutation = trpc.admin.addOutreachContacts.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.added} contacts added to campaign`);
      setContactsText("");
      setSelectedCampaign(null);
    },
    onError: (err) => toast.error(err.message || "Failed to add contacts"),
  });

  const sendMutation = trpc.admin.sendCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent to ${data.sent} contacts!`);
      void refetchCampaigns();
    },
    onError: (err) => toast.error(err.message || "Failed to send campaign"),
  });

  const handleCreate = () => {
    if (!createForm.name.trim() || !createForm.country.trim()) {
      toast.error("Campaign name and country are required.");
      return;
    }
    createMutation.mutate(createForm);
  };

  const parseContacts = (text: string) => {
    const lines = text.trim().split("\n").filter(Boolean);
    return lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        email: parts[0] || "",
        name: parts[1] || undefined,
        studioName: parts[2] || undefined,
        country: parts[3] || undefined,
        language: parts[4] || "en",
      };
    }).filter((c) => c.email.includes("@"));
  };

  const handleAddContacts = (campaignId: number) => {
    const contacts = parseContacts(contactsText);
    if (contacts.length === 0) {
      toast.error("No valid email addresses found. Format: email, name, studio, country, language");
      return;
    }
    addContactsMutation.mutate({ campaignId, contacts });
  };

  const handleSend = (campaignId: number) => {
    sendMutation.mutate({ campaignId, origin: window.location.origin });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Artist Outreach</h1>
              <p className="text-xs text-muted-foreground">
                Autonomous AI email campaigns to recruit tattoo artists globally
              </p>
            </div>
          </div>
          <Button
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold gap-2"
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Create Campaign Form */}
        {showCreate && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-foreground">Create AI Campaign</h2>
              <span className="text-xs text-muted-foreground ml-1">
                — AI generates a personalised email in the target language
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Campaign name *</Label>
                <Input
                  placeholder="e.g. Japan Q2 2026"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Target country *</Label>
                <Input
                  placeholder="e.g. Japan"
                  value={createForm.country}
                  onChange={(e) => setCreateForm((f) => ({ ...f, country: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Region (optional)</Label>
                <Input
                  placeholder="e.g. Tokyo, Osaka"
                  value={createForm.region}
                  onChange={(e) => setCreateForm((f) => ({ ...f, region: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Email language</Label>
                <select
                  value={createForm.language}
                  onChange={(e) => setCreateForm((f) => ({ ...f, language: e.target.value }))}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
              <p className="font-semibold text-cyan-400 mb-1">🤖 AI will generate:</p>
              <p>A culturally appropriate outreach email in <strong className="text-foreground">{LANGUAGES.find(l => l.code === createForm.language)?.label || "English"}</strong> for tattoo artists in <strong className="text-foreground">{createForm.country || "the target country"}</strong>, explaining the tatt-ooo platform and inviting them to join as a listed artist.</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-border/40"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating with AI…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Campaign</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Campaigns list */}
        {!campaigns || campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first outreach campaign to start recruiting tattoo artists globally.
            </p>
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const statusCfg = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
              const StatusIcon = statusCfg.icon;
              const isExpanded = expandedPreview === campaign.id;

              return (
                <div
                  key={campaign.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  {/* Campaign header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-foreground truncate">{campaign.name}</h3>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", statusCfg.bg, statusCfg.color)}>
                            <StatusIcon className={cn("w-3 h-3", campaign.status === "sending" && "animate-spin")} />
                            {statusCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {campaign.country}{campaign.region ? `, ${campaign.region}` : ""}
                          </span>
                          <span>·</span>
                          <span>{LANGUAGES.find(l => l.code === campaign.language)?.label || campaign.language}</span>
                          <span>·</span>
                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{campaign.sentCount}</p>
                          <p className="text-[10px] text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-cyan-400">{campaign.openCount}</p>
                          <p className="text-[10px] text-muted-foreground">Opens</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-400">{campaign.clickCount}</p>
                          <p className="text-[10px] text-muted-foreground">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-400">{campaign.signupCount}</p>
                          <p className="text-[10px] text-muted-foreground">Signups</p>
                        </div>
                      </div>
                    </div>

                    {/* Subject line */}
                    {campaign.subjectLine && (
                      <div className="mt-3 px-3 py-2 bg-background/60 rounded-lg border border-border/30">
                        <p className="text-xs text-muted-foreground">Subject:</p>
                        <p className="text-sm text-foreground font-medium">{campaign.subjectLine}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Preview email */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border/40 text-muted-foreground text-xs gap-1.5"
                        onClick={() => setExpandedPreview(isExpanded ? null : campaign.id)}
                      >
                        <Eye className="w-3 h-3" />
                        {isExpanded ? "Hide" : "Preview"} Email
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>

                      {/* Add contacts */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border/40 text-muted-foreground text-xs gap-1.5"
                        onClick={() => setSelectedCampaign(selectedCampaign === campaign.id ? null : campaign.id)}
                      >
                        <Upload className="w-3 h-3" />
                        Add Contacts
                      </Button>

                      {/* Send */}
                      {campaign.status !== "completed" && (
                        <Button
                          size="sm"
                          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs gap-1.5"
                          onClick={() => handleSend(campaign.id)}
                          disabled={sendMutation.isPending}
                        >
                          {sendMutation.isPending ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Sending…</>
                          ) : (
                            <><Send className="w-3 h-3" /> Send Campaign</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Email preview */}
                  {isExpanded && campaign.emailBodyHtml && (
                    <div className="border-t border-border/30 p-5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Email Body Preview
                      </p>
                      <div
                        className="bg-white rounded-xl p-4 text-sm text-gray-800 max-h-64 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: campaign.emailBodyHtml }}
                      />
                    </div>
                  )}

                  {/* Add contacts form */}
                  {selectedCampaign === campaign.id && (
                    <div className="border-t border-border/30 p-5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Import Contacts (CSV format)
                      </p>
                      <div className="bg-background/60 border border-border/30 rounded-lg p-3 mb-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">Format (one per line):</p>
                        <code className="text-cyan-400">email, name, studio_name, country, language_code</code>
                        <p className="mt-1">Example: <code className="text-cyan-400">artist@studio.jp, Kenji Tanaka, Tokyo Ink, Japan, ja</code></p>
                      </div>
                      <Textarea
                        placeholder={"artist@studio.jp, Kenji Tanaka, Tokyo Ink, Japan, ja\nartist2@tattoo.fr, Marie Dupont, Paris Tattoo, France, fr"}
                        value={contactsText}
                        onChange={(e) => setContactsText(e.target.value)}
                        className="bg-background border-border min-h-[120px] resize-none font-mono text-xs mb-3"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {parseContacts(contactsText).length} valid contacts detected
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border/40 text-xs"
                            onClick={() => { setSelectedCampaign(null); setContactsText(""); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs"
                            onClick={() => handleAddContacts(campaign.id)}
                            disabled={addContactsMutation.isPending}
                          >
                            {addContactsMutation.isPending ? (
                              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Adding…</>
                            ) : (
                              <><Users className="w-3 h-3 mr-1" /> Add Contacts</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="bg-card/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">How the outreach system works</p>
              <p>1. <strong className="text-foreground">Create a campaign</strong> — AI generates a personalised email in the artist's native language for the target country.</p>
              <p>2. <strong className="text-foreground">Import contacts</strong> — Paste artist emails in CSV format (email, name, studio, country, language).</p>
              <p>3. <strong className="text-foreground">Send campaign</strong> — Emails are sent in batches of 100 with personalised content and tracking pixels.</p>
              <p>4. <strong className="text-foreground">Track results</strong> — Monitor opens, clicks, and signups in real-time from this dashboard.</p>
              <p className="text-muted-foreground/60 mt-2">Email sending requires a valid Resend API key configured in Settings → Secrets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
