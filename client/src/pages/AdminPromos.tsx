import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, PowerOff, Tag } from "lucide-react";

type PromoRow = {
  id: number;
  code: string;
  discountPercent: number;
  bonusCredits: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export default function AdminPromos() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const utils = trpc.useUtils();
  const { data: promos, isLoading } = trpc.admin.listPromos.useQuery();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(0);
  const [newBonus, setNewBonus] = useState(0);
  const [newDesc, setNewDesc] = useState("");
  const [newMaxUses, setNewMaxUses] = useState(1000);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PromoRow | null>(null);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editBonus, setEditBonus] = useState(0);
  const [editDesc, setEditDesc] = useState("");
  const [editMaxUses, setEditMaxUses] = useState(1000);
  const [editActive, setEditActive] = useState(true);

  const createMutation = trpc.admin.createPromo.useMutation({
    onSuccess: () => {
      toast.success("Promo code created.");
      utils.admin.listPromos.invalidate();
      setCreateOpen(false);
      setNewCode(""); setNewDiscount(0); setNewBonus(0); setNewDesc(""); setNewMaxUses(1000);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updatePromo.useMutation({
    onSuccess: () => {
      toast.success("Promo code updated.");
      utils.admin.listPromos.invalidate();
      setEditOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deletePromo.useMutation({
    onSuccess: () => {
      toast.success("Promo code deactivated.");
      utils.admin.listPromos.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function openEdit(p: PromoRow) {
    setEditTarget(p);
    setEditDiscount(p.discountPercent);
    setEditBonus(p.bonusCredits);
    setEditDesc(p.description ?? "");
    setEditMaxUses(p.maxUses);
    setEditActive(p.isActive);
    setEditOpen(true);
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Promo Codes</h1>
            <p className="text-xs text-zinc-400">Create, edit, and deactivate promotional codes</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Code
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : !promos?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Tag className="w-8 h-8 text-zinc-600" />
            <p className="text-zinc-500 text-sm">No promo codes yet. Create one to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Code</TableHead>
                <TableHead className="text-zinc-400">Discount</TableHead>
                <TableHead className="text-zinc-400">Bonus Cr.</TableHead>
                <TableHead className="text-zinc-400">Uses</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Description</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map((p) => (
                <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-800/40">
                  <TableCell>
                    <span className="font-mono font-bold text-cyan-400 text-sm">{p.code}</span>
                  </TableCell>
                  <TableCell className="text-white">
                    {p.discountPercent > 0 ? `${p.discountPercent}% off` : "—"}
                  </TableCell>
                  <TableCell className="text-white">
                    {p.bonusCredits > 0 ? `+${p.bonusCredits} cr` : "—"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {p.usedCount} / {p.maxUses}
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                    ) : (
                      <Badge className="bg-zinc-700/40 text-zinc-500 border-zinc-700">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm max-w-[180px] truncate">
                    {p.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-zinc-400 hover:text-white"
                        onClick={() => openEdit(p as PromoRow)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {p.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-400 hover:text-red-300"
                          onClick={() => deleteMutation.mutate({ id: p.id })}
                          disabled={deleteMutation.isPending}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Code</Label>
              <Input
                placeholder="e.g. SUMMER30"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="bg-zinc-800 border-zinc-700 text-white font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Discount %</Label>
                <Input
                  type="number" min={0} max={100}
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Bonus Credits</Label>
                <Input
                  type="number" min={0}
                  value={newBonus}
                  onChange={(e) => setNewBonus(Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Max Uses</Label>
              <Input
                type="number" min={1}
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Description (optional)</Label>
              <Input
                placeholder="e.g. Summer launch campaign"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-500 text-white"
              disabled={!newCode.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  code: newCode,
                  discountPercent: newDiscount,
                  bonusCredits: newBonus,
                  description: newDesc || undefined,
                  maxUses: newMaxUses,
                })
              }
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit — <span className="font-mono text-cyan-400">{editTarget?.code}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Discount %</Label>
                <Input
                  type="number" min={0} max={100}
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Bonus Credits</Label>
                <Input
                  type="number" min={0}
                  value={editBonus}
                  onChange={(e) => setEditBonus(Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Max Uses</Label>
              <Input
                type="number" min={1}
                value={editMaxUses}
                onChange={(e) => setEditMaxUses(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Description</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-zinc-300 text-sm">Active</Label>
              <button
                type="button"
                onClick={() => setEditActive(!editActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editActive ? "bg-violet-600" : "bg-zinc-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-500 text-white"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editTarget) return;
                updateMutation.mutate({
                  id: editTarget.id,
                  discountPercent: editDiscount,
                  bonusCredits: editBonus,
                  description: editDesc || undefined,
                  maxUses: editMaxUses,
                  isActive: editActive,
                });
              }}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
