"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import NavBar from "@/components/NavBar";

type Partner = { partner_id: string; partner_name: string; code: string };
type PendingInvite = { id: string; code: string };

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function DuoRosterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [redeemInput, setRedeemInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh(uid: string) {
    const { data: mine } = await supabase.rpc("my_duo_partners");
    setPartners(mine ?? []);
    const { data: pendingInvites } = await supabase.from("duo_invites").select("id, code").eq("inviter_id", uid).eq("status", "pending");
    setPending(pendingInvites ?? []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
      refresh(data.user.id);
    });
  }, [router]);

  async function sendInvite() {
    if (!userId || pending.length + partners.length >= 3) return;
    const code = genCode();
    const { error: insertErr } = await supabase.from("duo_invites").insert({ inviter_id: userId, code });
    if (insertErr) { setError(insertErr.message); return; }
    try { await navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2500); } catch {}
    track("duo_invite_sent");
    refresh(userId);
  }

  async function redeem() {
    if (!redeemInput.trim() || !userId) return;
    setError("");
    const { data, error: rpcErr } = await supabase.rpc("redeem_duo_invite", { invite_code: redeemInput.trim().toUpperCase() });
    if (rpcErr || !data?.ok) { setError(data?.error ?? rpcErr?.message ?? "Couldn't redeem that code."); return; }
    setRedeemInput("");
    track("duo_invite_accepted");
    refresh(userId);
  }

  async function cancelInvite(inviteId: string) {
    if (!userId) return;
    await supabase.rpc("cancel_duo_invite", { p_invite_id: inviteId });
    refresh(userId);
  }

  async function removePartner(partnerId: string) {
    if (!userId) return;
    await supabase.rpc("unlink_duo_partner", { p_partner_id: partnerId });
    track("duo_partner_removed");
    refresh(userId);
  }

  async function startSession(partnerId: string) {
    router.push(`/duo/matches?partner=${partnerId}`);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  const slotsUsed = partners.length + pending.length;

  return (
    <div className="pb-24">
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-1">DOUBLE DATE</p>
      <h2 className="text-2xl mb-2">Team up with a friend.</h2>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        Double Date is for real-life friends only. Generate a code, send it to a friend outside the app, and your accounts link once they accept.
      </p>

      <button onClick={sendInvite} disabled={slotsUsed >= 3} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void disabled:opacity-40 mb-2">
        {slotsUsed >= 3 ? "All 3 invite slots full" : "Copy invite code for a friend"}
      </button>
      {copiedCode && <p className="text-cyan text-[10px] font-mono text-center mb-4">CODE &quot;{copiedCode}&quot; COPIED TO CLIPBOARD</p>}

      <div className="mb-6">
        <label className="text-xs text-muted block mb-1.5">Got a code from a friend?</label>
        <div className="flex gap-2">
          <input value={redeemInput} onChange={(e) => setRedeemInput(e.target.value.toUpperCase())} placeholder="ABC123" autoComplete="off" autoCapitalize="characters" className="flex-1 rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none tracking-widest min-h-[44px]" />
          <button onClick={redeem} className="rounded-full px-4 bg-raised border border-line text-bone text-xs font-semibold min-h-[44px]">Redeem</button>
        </div>
      </div>

      {error && <p className="text-red text-xs mb-4 font-mono">{error}</p>}

      <div className="space-y-2">
        {partners.map((p) => (
          <div key={p.partner_id} className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3">
            <div className="flex-1">
              <p className="text-sm">{p.partner_name}</p>
              <p className="text-[10px] text-cyanDim font-mono">LINKED</p>
            </div>
            <button onClick={() => startSession(p.partner_id)} className="rounded-full px-3 py-2 bg-cyan text-void text-xs font-semibold min-h-[36px]">Start</button>
            <button onClick={() => removePartner(p.partner_id)} className="text-muted text-lg w-9 h-9 flex items-center justify-center shrink-0">×</button>
          </div>
        ))}
        {pending.map((inv) => (
          <div key={inv.id} className="bg-surface border border-line rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-cyanDim font-mono">WAITING FOR ACCEPTANCE</p>
              <button onClick={() => cancelInvite(inv.id)} className="text-muted text-xs font-mono py-1 px-2 -mr-2 min-h-[32px]">CANCEL</button>
            </div>
            <div className="flex items-center justify-between bg-raised rounded-md px-3 py-2">
              <span className="text-cyan text-lg font-mono tracking-widest">{inv.code}</span>
            </div>
          </div>
        ))}
        {partners.length === 0 && pending.length === 0 && (
          <p className="text-muted text-xs text-center mt-6">No invites yet — generate a code above to get started.</p>
        )}
      </div>
      <NavBar />
    </div>
  );
}
