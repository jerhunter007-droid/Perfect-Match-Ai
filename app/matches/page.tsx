"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import NavBar from "@/components/NavBar";

type Card = {
  id: string;
  candidate_profile_id: string;
  score: number;
  explanation: string;
  decision: string;
  candidate?: { name: string; age: number; city: string; bio: string; photos: string[] };
};

const REPORT_REASONS = ["Fake profile / bot", "Inappropriate photos", "Harassment or threats", "Underage", "Spam or scam", "Other"];

function MatchesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceRefresh = searchParams.get("refresh") === "1";

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mutualName, setMutualName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [gatesEnabled, setGatesEnabled] = useState(false);
  const [lastDeclined, setLastDeclined] = useState<Card | null>(null);

  const redoAllowed = !gatesEnabled || isPremium;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: myProfile } = await supabase.from("profiles").select("onboarding_status").eq("id", session.user.id).single();
      if (myProfile?.onboarding_status === "pending_verification") { router.push("/verify-identity"); return; }
      if (myProfile?.onboarding_status === "pending_age_verification") { router.push("/verify-age"); return; }
      if (myProfile?.onboarding_status !== "active") { router.push("/onboarding"); return; }

      const { data: sub } = await supabase.from("subscriptions").select("status").eq("profile_id", session.user.id).maybeSingle();
      setIsPremium(sub?.status === "active");
      const { data: gateSetting } = await supabase.from("app_settings").select("value").eq("key", "premium_gates_enabled").maybeSingle();
      setGatesEnabled(gateSetting?.value ?? false);

      let rawCards: Card[] = [];
      let stackResetAt: string | null = null;

      if (!forceRefresh) {
        const { data: existingStack } = await supabase
          .from("daily_stacks")
          .select("id, reset_at, stack_cards(*)")
          .eq("profile_id", session.user.id)
          .eq("mode", "solo")
          .gt("reset_at", new Date().toISOString())
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        rawCards = existingStack?.stack_cards ?? [];
        stackResetAt = existingStack?.reset_at ?? null;
      }

      if (rawCards.length === 0) {
        track("scan_started", { mode: "solo" });
        const { data, error: fnErr } = await supabase.functions.invoke("generate-stack", { body: { mode: "solo" } });
        if (fnErr) { setError("Couldn't load matches. Try again in a moment."); setLoading(false); return; }
        rawCards = data.cards ?? [];
        stackResetAt = data.reset_at ?? null;
        if (data.message) setError(data.message);
        track("scan_completed", { mode: "solo", card_count: rawCards.length });
      }
      setResetAt(stackResetAt);

      const candidateIds = rawCards.map((c: Card) => c.candidate_profile_id);
      const { data: candidateProfiles } = await supabase.from("profiles").select("id, name, age, city, bio").in("id", candidateIds);
      const { data: candidatePhotos } = await supabase.from("profile_photos").select("profile_id, url, position").in("profile_id", candidateIds).order("position");

      const enriched = rawCards
        .sort((a: any, b: any) => a.position - b.position)
        .map((c: Card) => {
          const p = candidateProfiles?.find((cp) => cp.id === c.candidate_profile_id);
          const photos = (candidatePhotos ?? []).filter((ph) => ph.profile_id === c.candidate_profile_id).map((ph) => ph.url);
          return { ...c, candidate: p ? { ...p, photos } : undefined };
        })
        .filter((c: Card) => c.decision === "pending" && c.candidate);

      setCards(enriched);
      setLoading(false);
    })();
  }, [router, forceRefresh]);

  async function decide(decision: "accepted" | "declined") {
    const card = cards[index];
    if (!card) return;
    setRevealed(false);
    const { data } = await supabase.rpc("decide_card", { p_card_id: card.id, p_decision: decision });
    track(decision === "accepted" ? "swipe_accept" : "swipe_decline", { candidate_id: card.candidate_profile_id });
    if (decision === "declined") setLastDeclined(card);
    if (data?.mutual) {
      setMutualName(card.candidate?.name ?? "them");
      track("match_formed", { candidate_id: card.candidate_profile_id });
    } else {
      setIndex((i) => i + 1);
    }
  }

  async function redo() {
    if (!lastDeclined) return;
    const { data } = await supabase.rpc("undo_last_decline", { p_card_id: lastDeclined.id });
    if (!data?.ok) {
      setLastDeclined(null);
      return;
    }
    track("swipe_redo", { candidate_id: lastDeclined.candidate_profile_id });
    setCards((prev) => {
      const withoutOld = prev.filter((c) => c.id !== lastDeclined.id);
      const restored = { ...lastDeclined, decision: "pending" };
      const insertAt = Math.min(index, withoutOld.length);
      return [...withoutOld.slice(0, insertAt), restored, ...withoutOld.slice(insertAt)];
    });
    setLastDeclined(null);
  }

  function closeMutual() {
    setMutualName(null);
    setIndex((i) => i + 1);
  }

  async function submitReport(reason: string) {
    const card = cards[index];
    if (!card) return;
    await supabase.rpc("block_and_report", { p_blocked_id: card.candidate_profile_id, p_reason: reason });
    track("report_submitted", { reason });
    setReportOpen(false);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <div className="w-16 h-16 rounded-full border border-cyan animate-pulse mb-4" />
        <p className="text-cyan text-xs font-mono">FINDING YOUR MATCHES…</p>
      </div>
    );
  }

  const card = cards[index];

  if (mutualName) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center text-center" style={{ background: "radial-gradient(circle at center, rgba(255,46,196,0.28), rgba(11,14,31,0.97))" }}>
        <span className="text-5xl">♥</span>
        <p className="text-cyan text-xl font-mono mt-4">PERFECT MATCH</p>
        <p className="text-bone mt-2">You and {mutualName} both said yes.</p>
        <button onClick={closeMutual} className="mt-6 rounded-full px-5 py-2.5 bg-cyan text-void text-sm font-semibold">Keep swiping</button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <p className="text-cyan font-mono text-sm mb-2">THAT&apos;S EVERYONE FOR NOW</p>
        <p className="text-muted text-sm mb-2">{error || "Check back once your reset window is up, or invite more friends to the beta so there's a bigger pool."}</p>
        {resetAt && <p className="text-muted text-xs font-mono">NEXT RESET: {new Date(resetAt).toLocaleString()}</p>}
        <Link href="/filters" className="text-cyan text-xs font-mono mt-4">Adjust discovery settings →</Link>
        <NavBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[90vh] pb-20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted text-xs font-mono">POTENTIAL MATCHES {index + 1} / {cards.length}</p>
        <Link href="/filters" className="text-muted text-xs font-mono border border-line rounded-full px-2.5 py-1">FILTERS</Link>
      </div>
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-line bg-surface" onClick={() => setRevealed((r) => !r)}>
        {card.candidate?.photos[0] && <img src={card.candidate.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(11,14,31,0.92) 100%)" }} />
        {!revealed ? (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl text-white">{card.candidate?.name}, {card.candidate?.age}</h3>
                <p className="text-white/75 text-xs font-mono">{card.candidate?.city}</p>
              </div>
              <div className="rounded-full px-3 py-1.5 border border-cyan bg-cyan/15 text-cyan text-xs font-mono">{card.score}%</div>
            </div>
            <p className="text-white/60 text-[10px] font-mono mt-2">TAP FOR FULL PROFILE</p>
          </div>
        ) : (
          <div className="absolute inset-0 bg-surface p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl">{card.candidate?.name}, {card.candidate?.age}</h3>
              <button onClick={() => setReportOpen(true)} className="text-muted text-xs font-mono border border-line rounded-full px-2.5 py-1">REPORT</button>
            </div>
            <p className="text-muted text-xs font-mono mb-3">{card.candidate?.city}</p>
            <div className="bg-raised rounded-xl p-3 mb-4">
              <p className="text-cyan text-xs font-mono mb-1">WHY YOU MATCH</p>
              <p className="text-sm leading-relaxed">{card.explanation}</p>
            </div>
            <p className="text-sm leading-relaxed">{card.candidate?.bio}</p>
          </div>
        )}
      </div>
      <div className="flex justify-center items-center gap-6 mt-4">
        {redoAllowed && (
          <button
            onClick={redo}
            disabled={!lastDeclined}
            className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center text-cyan text-lg disabled:opacity-30"
          >
            ↺
          </button>
        )}
        <button onClick={() => decide("declined")} className="w-16 h-16 rounded-full border border-line bg-surface flex items-center justify-center text-red text-2xl">✕</button>
        <button onClick={() => decide("accepted")} className="w-16 h-16 rounded-full bg-cyan flex items-center justify-center text-void text-2xl">♥</button>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end">
          <div className="w-full bg-surface rounded-t-2xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <p className="text-cyan text-sm font-mono mb-1">BLOCK &amp; REPORT {card.candidate?.name}</p>
            <p className="text-muted text-xs mb-4">This removes them from your stack and any match immediately.</p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => submitReport(r)} className="w-full text-left rounded-lg bg-raised border border-line px-3 py-2.5 text-sm">{r}</button>
              ))}
            </div>
            <button onClick={() => setReportOpen(false)} className="w-full rounded-full py-2.5 text-sm text-muted border border-line">Cancel</button>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>}>
      <MatchesInner />
    </Suspense>
  );
}
