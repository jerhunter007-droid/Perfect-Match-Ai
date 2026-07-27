"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

type Message = { id: string; sender_id: string | null; body: string; created_at: string };
type Profile = {
  name: string;
  age: number | null;
  city: string | null;
  bio: string;
  interests: string[];
  photo: string | null;
};
const REPORT_REASONS = ["Fake profile / bot", "Inappropriate photos", "Harassment or threats", "Underage", "Spam or scam", "Other"];

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [myId, setMyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [otherIds, setOtherIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setMyId(session.user.id);

      const { data: members } = await supabase.from("match_members").select("profile_id").eq("match_id", matchId);
      const others = (members ?? []).map((m) => m.profile_id).filter((id) => id !== session.user.id);
      setOtherIds(others);
      const { data: othersData } = await supabase.from("profiles").select("id, name, age, city, bio, interests").in("id", others);
      setTitle((othersData ?? []).map((o) => o.name).join(" & ") || "Match");

      if (others.length === 1 && othersData && othersData[0]) {
        const { data: photos } = await supabase.from("profile_photos").select("url").eq("profile_id", others[0]).order("position", { ascending: true }).limit(1);
        setProfile({
          name: othersData[0].name,
          age: othersData[0].age,
          city: othersData[0].city,
          bio: othersData[0].bio,
          interests: othersData[0].interests ?? [],
          photo: photos?.[0]?.url ?? null,
        });
      }

      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
      setMessages(msgs ?? []);
      setLoading(false);
      track("chat_thread_opened", { match_id: matchId });
      await supabase.rpc("mark_match_read", { p_match_id: matchId });

      const channel = supabase
        .channel(`messages-${matchId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          supabase.rpc("mark_match_read", { p_match_id: matchId });
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    })();
  }, [matchId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || !myId) return;
    const body = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({ match_id: matchId, sender_id: myId, body });
    track("message_sent", { match_id: matchId });
  }

  async function unmatch() {
    await supabase.rpc("unmatch", { p_match_id: matchId });
    track("unmatch", { match_id: matchId });
    router.push("/chat");
  }

  async function submitReport(reason: string) {
    for (const id of otherIds) {
      await supabase.rpc("block_and_report", { p_blocked_id: id, p_reason: reason });
    }
    track("report_submitted", { reason, match_id: matchId });
    router.push("/chat");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="relative flex flex-col min-h-[90vh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img src="/pm-logo.png" alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] max-w-none opacity-[0.05] blur-[2px]" />
      </div>
      <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-muted text-lg w-9 h-9 flex items-center justify-center -ml-2">←</Link>
          {profile ? (
            <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-raised" />
              )}
              <p className="text-base text-bone">{title}</p>
            </button>
          ) : (
            <p className="text-base">{title}</p>
          )}
        </div>
        <button onClick={() => setMenuOpen(true)} className="text-muted text-xl w-9 h-9 flex items-center justify-center">⋯</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {messages.length === 0 && (
          <p className="text-muted text-xs text-center mt-10">You matched with {title}. Say hi — either of you can send the first message.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === myId ? "ml-auto bg-cyan text-void" : "bg-surface text-bone"}`}>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-full px-4 py-2.5 text-base bg-surface border border-line text-bone outline-none"
        />
        <button onClick={send} className="rounded-full px-4 bg-cyan text-void text-sm font-semibold min-h-[44px] min-w-[44px]">Send</button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end" onClick={() => setMenuOpen(false)}>
          <div className="w-full bg-surface rounded-t-2xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setMenuOpen(false); setReportOpen(true); }} className="w-full text-left rounded-lg bg-raised border border-line px-3 py-3 text-sm text-red mb-2">Block &amp; report {title}</button>
            <button onClick={unmatch} className="w-full text-left rounded-lg bg-raised border border-line px-3 py-3 text-sm mb-4">Unmatch</button>
            <button onClick={() => setMenuOpen(false)} className="w-full rounded-full py-2.5 text-sm text-muted border border-line">Cancel</button>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end">
          <div className="w-full bg-surface rounded-t-2xl p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <p className="text-cyan text-sm font-mono mb-1">BLOCK &amp; REPORT {title}</p>
            <p className="text-muted text-xs mb-4">This ends the conversation and removes them from your matches immediately.</p>
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((r) => (
                <button key={r} onClick={() => submitReport(r)} className="w-full text-left rounded-lg bg-raised border border-line px-3 py-2.5 text-sm">{r}</button>
              ))}
            </div>
            <button onClick={() => setReportOpen(false)} className="w-full rounded-full py-2.5 text-sm text-muted border border-line">Cancel</button>
          </div>
        </div>
      )}

      {profileOpen && profile && (
        <div className="fixed inset-0 z-50 bg-void flex flex-col">
          <div className="p-4">
            <button onClick={() => setProfileOpen(false)} className="text-muted text-lg w-9 h-9 flex items-center justify-center -ml-2">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col items-center text-center gap-3">
            {profile.photo ? (
              <img src={profile.photo} alt="" className="w-28 h-28 rounded-full object-cover" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-raised" />
            )}
            <p className="text-xl text-bone">{profile.name}{profile.age ? `, ${profile.age}` : ""}</p>
            {profile.city && <p className="text-sm text-muted">{profile.city}</p>}
            {profile.bio && <p className="text-sm text-bone/80 mt-2 max-w-xs">{profile.bio}</p>}
            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {profile.interests.map((i) => (
                  <span key={i} className="text-xs text-bone/80 bg-surface border border-line rounded-full px-3 py-1">{i}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
