"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import NavBar from "@/components/NavBar";

const REPORT_REASONS = ["Fake profile / bot", "Inappropriate photos", "Harassment or threats", "Underage", "Spam or scam", "Other"];

type Card = {
  id: string;
  candidate_profile_id: string;
  candidate_duo_partner_id: string | null;
  score: number;
  explanation: string;
  decision: string;
};
type PersonInfo = { id: string; name: string; age: number; city: string; bio: string; photos: string[] };

function DuoMatchesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const partnerId = params.get("partner");

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [people, setPeople] = useState<Record<string, PersonInfo>>({});
  const [me, setMe] = useState<PersonInfo | null>(null);
  const [partner, setPartner] = useState<PersonInfo | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showJoint, setShowJoint] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!partnerId) { router.push("/duo"); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      async function fetchPerson(id: string): Promise<PersonInfo> {
        const { data: p } = await supabase.from("profiles").select("id, name, age, city, bio").eq("id", id).single();
        const { data: photos } = await supabase.from("profile_photos").select("url").eq("profile_id", id).order("position");
        return { ...p, photos: (photos ?? []).map((ph) => ph.url) } as PersonInfo;
      }
      setMe(await fetchPerson(session.user.id));
      setPartner(await fetchPerson(partnerId));

      const { data: existingStack } = await supabase
        .from("daily_stacks").select("id, reset_at, stack_cards(*)")
        .eq("profile_id", session.user.id).eq("mode", "duo").eq("duo_partner_id", partnerId)
        .gt("reset_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("generated_at", { ascending: false }).limit(1).maybeSingle();

      let rawCards = existingStack?.stack_cards ?? [];
      if (rawCards.length === 0) {
        track("scan_started", { mode: "duo" });
        const { data, error: fnErr } = await supabase.functions.invoke("generate-stack", { body: { mode: "duo", duo_partner_id: partnerId } });
        if (fnErr) { setError("Couldn't load duo matches."); setLoading(false); return; }
        rawCards = data.cards ?? [];
        if (data.message) setError(data.message);
        track("scan_completed", { mode: "duo", card_count: rawCards.length });
      }

      const pending = rawCards.filter((c: Card) => c.decision === "pending").sort((a: any, b: any) => a.position - b.position);
      const ids = new Set<string>();
      pending.forEach((c: Card) => { if (c.candidate_profile_id) ids.add(c.candidate_profile_id); if (c.candidate_duo_partner_id) ids.add(c.candidate_duo_partner_id); });
      const peopleMap: Record<string, PersonInfo> = {};
      for (const id of ids) peopleMap[id] = await fetchPerson(id);

      setPeople(peopleMap);
      setCards(pending);
      setLoading(false);
    })();
  }, [partnerId, router]);

  async function decide(decision: "accepted" | "declined") {
    const card = cards[index];
    if (!card) return;
    setRevealed(false);
    const { data } = await supabase.rpc("decide_duo_card", { p_card_id: card.id, p_decision: decision });
    track(decision === "accepted" ? "duo_swipe_accept" : "duo_swipe_decline");
    if (data?.mutual) {
      setMutual(true);
      track("duo_match_formed");
    } else {
      setIndex((i) => i + 1);
    }
  }

  async function submitReport(reason: string) {
    const card = cards[index];
    if (!card) return;
    await supabase.rpc("block_and_report", { p_blocked_id: card.candidate_profile_id, p_reason: reason });
    if (card.candidate_duo_partner_id) await supabase.rpc("block_and_report", { p_blocked_id: card.candidate_duo_partner_id, p_reason: reason });
    track("report_submitted", { reason, mode: "duo" });
    setReportOpen(false);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-cyan text-xs font-mono">FINDING DOUBLE DATES…</div>;

  if (mutual) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center text-center" style={{ background: "radial-gradient(circle at center, rgba(255,46,196,0.28), rgba(11,14,31,0.97))" }}>
        <span className="text-5xl">♥</span>
        <p className="text-cyan text-xl font-mono mt-4">DOUBLE DATE PERFECT MATCH</p>
        <p className="text-bone mt-2">All four of you said yes.</p>
        <button onClick={() => { setMutual(false); setIndex((i) => i + 1); }} className="mt-6 rounded-full px-5 py-2.5 bg-cyan text-void text-sm font-semibold">Keep going</button>
      </div>
    );
  }

  const card = cards[index];
  const a = card ? people[card.candidate_profile_id] : null;
  const b = card?.candidate_duo_partner_id ? people[card.candidate_duo_partner_id] : null;

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setShowJoint(true)} className="flex items-center gap-2 bg-raised rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] text-muted font-mono">YOU & {partner?.name?.toUpperCase()}</span>
        </button>
        <span className="text-muted text-xs font-mono">DUO {index + 1} / {cards.length}</span>
      </div>
      <p className="text-[9px] text-muted font-mono mb-3">ALL 4 PEOPLE MUST SAY YES FOR A DOUBLE MATCH</p>

      {!card || !a ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <p className="text-cyan font-mono text-sm mb-2">THAT&apos;S EVERYONE FOR NOW</p>
          <p className="text-muted text-sm">{error || "Invite more friends so there's a bigger duo pool."}</p>
        </div>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden border border-line bg-surface" style={{ height: "60vh" }} onClick={() => setRevealed((r) => !r)}>
            <div className="flex h-full">
              <div className="w-1/2 relative">{a.photos[0] && <img src={a.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />}</div>
              <div className="w-1/2 relative">{b?.photos[0] && <img src={b.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />}</div>
            </div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-cyan" style={{ boxShadow: "0 0 8px #FF2EC4" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(11,14,31,0.9) 100%)" }} />
            {!revealed ? (
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-lg">{a.name} & {b?.name ?? ""}</p>
                <div className="inline-block mt-2 rounded-full px-3 py-1.5 border border-cyan bg-cyan/15 text-cyan text-xs font-mono">{card.score}% GROUP FIT</div>
                <p className="text-white/60 text-[10px] font-mono mt-2">TAP FOR FULL PROFILES</p>
              </div>
            ) : (
              <div className="absolute inset-0 bg-surface p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <span />
                  <button onClick={() => setReportOpen(true)} className="text-muted text-xs font-mono border border-line rounded-full px-2.5 py-1">REPORT</button>
                </div>
                <div className="bg-raised rounded-xl p-3 mb-4">
                  <p className="text-cyan text-xs font-mono mb-1">WHY YOU MATCH</p>
                  <p className="text-sm leading-relaxed">{card.explanation}</p>
                </div>
                {[a, b].filter(Boolean).map((p) => (
                  <div key={p!.id} className="flex gap-3 mb-4">
                    {p!.photos[0] && <img src={p!.photos[0]} alt="" className="w-14 h-18 object-cover rounded-lg" />}
                    <div>
                      <p className="text-sm">{p!.name}, {p!.age}</p>
                      <p className="text-muted text-[10px] font-mono">{p!.city}</p>
                      <p className="text-xs mt-1 leading-relaxed">{p!.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-center items-center gap-6 mt-4">
            <button onClick={() => decide("declined")} className="w-16 h-16 rounded-full border border-line bg-surface flex items-center justify-center text-red text-2xl">✕</button>
            <button onClick={() => decide("accepted")} className="w-16 h-16 rounded-full bg-cyan flex items-center justify-center text-void text-2xl">♥</button>
          </div>
        </>
      )}

      {showJoint && me && partner && (
        <div className="fixed inset-0 z-50 bg-void flex flex-col">
          <div className="flex items-center justify-between px-5 pt-6 pb-3">
            <button onClick={() => setShowJoint(false)} className="text-muted text-xl w-9 h-9 flex items-center justify-center -ml-2">×</button>
            <span className="text-cyan text-xs font-mono">OUR DOUBLE DATE PROFILE</span>
            <div className="w-5" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            <div className="flex gap-2 mb-4" style={{ height: 220 }}>
              {[me, partner].map((p) => (
                <div key={p.id} className="w-1/2 relative rounded-xl overflow-hidden">
                  {p.photos[0] && <img src={p.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
              ))}
            </div>
            <h3 className="text-lg mb-4">{me.name} & {partner.name}</h3>
            {[me, partner].map((p) => (
              <div key={p.id} className="mb-4">
                <p className="text-cyanDim text-xs font-mono">{p.name.toUpperCase()}</p>
                <p className="text-sm leading-relaxed mt-1">{p.bio}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end">
          <div className="w-full bg-surface rounded-t-2xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <p className="text-cyan text-sm font-mono mb-1">BLOCK &amp; REPORT {a?.name} &amp; {b?.name}</p>
            <p className="text-muted text-xs mb-4">This removes both of them from your stack and any match immediately.</p>
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

export default function DuoMatchesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>}>
      <DuoMatchesInner />
    </Suspense>
  );
}
