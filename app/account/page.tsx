"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PAYMENTS_ENABLED } from "@/lib/config";
import NavBar from "@/components/NavBar";
import FeedbackButton from "@/components/FeedbackButton";

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      const { data: ph } = await supabase.from("profile_photos").select("url").eq("profile_id", session.user.id).order("position");
      const { data: sub } = await supabase.from("subscriptions").select("status").eq("profile_id", session.user.id).maybeSingle();
      setProfile(p);
      setPhotos((ph ?? []).map((x) => x.url));
      setIsPremium(sub?.status === "active");
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function deleteAccount() {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error) { setDeleting(false); return; }
    track("account_deleted");
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading || !profile) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="pb-24">
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-4">ACCOUNT</p>
      <h2 className="text-2xl mb-4">{profile.name}, {profile.age}</h2>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {photos.map((p, i) => <img key={i} src={p} alt="" className="rounded-lg object-cover w-full" style={{ aspectRatio: "3/4" }} />)}
      </div>

      <div className={`rounded-2xl p-4 mb-6 border ${isPremium ? "bg-cyan/10 border-cyan" : "bg-surface border-line"}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-cyan text-xs font-mono">PERFECT MATCH+</p>
          {!PAYMENTS_ENABLED && !isPremium && <span className="text-[10px] text-muted font-mono border border-line rounded-full px-2 py-0.5">COMING SOON</span>}
        </div>
        {isPremium ? (
          <p className="text-sm">You&apos;re getting 30 potential matches every 10 hours, searching up to 3 locations worldwide.</p>
        ) : PAYMENTS_ENABLED ? (
          <>
            <p className="text-sm mb-3">Unlock <b>30 Potential Matches</b> on a <b>10 hour cycle</b> instead of 15 every 24 hours, plus search up to <b>3 locations worldwide</b>.</p>
            <button onClick={() => router.push("/upgrade")} className="w-full rounded-full py-2.5 bg-cyan text-void text-sm font-semibold">Upgrade</button>
          </>
        ) : (
          <p className="text-sm text-muted">Soon you&apos;ll be able to unlock <b className="text-bone">30 Potential Matches</b> on a <b className="text-bone">10 hour cycle</b> and search up to <b className="text-bone">3 locations worldwide</b>. Nothing to do for now — everyone gets the free tier during the beta launch.</p>
        )}
      </div>

      <div className="bg-surface border border-line rounded-2xl p-4 mb-6">
        <p className="text-muted text-xs font-mono mb-2">BIO</p>
        <p className="text-sm leading-relaxed">{profile.bio}</p>
      </div>

      <div className="space-y-2 mb-6">
        <Link href="/edit-profile" className="flex items-center justify-between bg-surface border border-line rounded-xl p-3.5 text-sm">
          Edit profile <span className="text-muted">›</span>
        </Link>
        <Link href="/filters" className="flex items-center justify-between bg-surface border border-line rounded-xl p-3.5 text-sm">
          Discovery settings <span className="text-muted">›</span>
        </Link>
        <FeedbackButton />
        <Link href="/terms" className="flex items-center justify-between bg-surface border border-line rounded-xl p-3.5 text-sm">
          Terms of Service <span className="text-muted">›</span>
        </Link>
        <Link href="/privacy" className="flex items-center justify-between bg-surface border border-line rounded-xl p-3.5 text-sm">
          Privacy Policy <span className="text-muted">›</span>
        </Link>
      </div>

      <button onClick={logout} className="w-full rounded-full py-3 border border-line text-bone text-sm mb-3">Log out</button>
      <button onClick={() => setDeleteOpen(true)} className="w-full rounded-full py-3 text-red text-sm">Delete my account</button>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end">
          <div className="w-full bg-surface rounded-t-2xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <p className="text-red text-sm font-mono mb-2">DELETE ACCOUNT</p>
            <p className="text-muted text-sm mb-5">This permanently deletes your profile, photos, matches, and messages. This can&apos;t be undone.</p>
            <button onClick={deleteAccount} disabled={deleting} className="w-full rounded-full py-3 bg-red text-void text-sm font-semibold mb-2 disabled:opacity-50">
              {deleting ? "Deleting…" : "Yes, permanently delete my account"}
            </button>
            <button onClick={() => setDeleteOpen(false)} className="w-full rounded-full py-2.5 text-sm text-muted border border-line">Cancel</button>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
}
