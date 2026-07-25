"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import NavBar from "@/components/NavBar";

type Thread = {
  matchId: string;
  isDuo: boolean;
  title: string;
  photo: string | null;
  lastMessage: string;
  unread: boolean;
};

export default function ChatListPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const myId = session.user.id;
      track("chat_list_viewed");

      const { data: myMemberships } = await supabase.from("match_members").select("match_id").eq("profile_id", myId);
      const matchIds = (myMemberships ?? []).map((m) => m.match_id);
      if (matchIds.length === 0) { setThreads([]); setLoading(false); return; }

      const { data: matches } = await supabase.from("matches").select("id, is_duo_match, created_at").in("id", matchIds).order("created_at", { ascending: false });
      const { data: allMembers } = await supabase.from("match_members").select("match_id, profile_id").in("match_id", matchIds);
      const { data: reads } = await supabase.from("match_reads").select("match_id, last_read_at").eq("profile_id", myId).in("match_id", matchIds);
      const readMap = new Map((reads ?? []).map((r) => [r.match_id, r.last_read_at]));

      const built: Thread[] = [];
      for (const m of matches ?? []) {
        const otherIds = (allMembers ?? []).filter((am) => am.match_id === m.id && am.profile_id !== myId).map((am) => am.profile_id);
        const { data: others } = await supabase.from("profiles").select("id, name").in("id", otherIds);
        const { data: photos } = await supabase.from("profile_photos").select("profile_id, url").in("profile_id", otherIds).eq("position", 0);
        const { data: lastMsg } = await supabase.from("messages").select("body, sender_id, created_at").eq("match_id", m.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

        const lastReadAt = readMap.get(m.id);
        const unread = !!lastMsg && lastMsg.sender_id !== myId && (!lastReadAt || new Date(lastMsg.created_at) > new Date(lastReadAt));

        built.push({
          matchId: m.id,
          isDuo: m.is_duo_match,
          title: (others ?? []).map((o) => o.name).join(" & ") || "Match",
          photo: photos?.[0]?.url ?? null,
          lastMessage: lastMsg?.body ?? "Say hi…",
          unread,
        });
      }
      setThreads(built);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="relative pb-24 min-h-[100dvh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img src="/pm-logo.png" alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] max-w-none opacity-[0.05] blur-[2px]" />
      </div>
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-4">MESSAGES</p>
      {threads.length === 0 ? (
        <p className="text-muted text-sm text-center mt-10">No matches yet — once you and someone both say yes, you&apos;ll chat here.</p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <Link key={t.matchId} href={`/chat/${t.matchId}`} className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3 min-h-[64px]">
              {t.photo ? <img src={t.photo} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 rounded-full bg-raised shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.unread ? "text-bone" : "text-bone/80"}`}>{t.title}</p>
                {t.isDuo && <p className="text-[9px] text-cyan font-mono">DOUBLE DATE PERFECT MATCH</p>}
                <p className={`text-xs truncate ${t.unread ? "text-bone" : "text-muted"}`}>{t.lastMessage}</p>
              </div>
              {t.unread && <span className="w-2.5 h-2.5 rounded-full bg-cyan shrink-0" />}
            </Link>
          ))}
        </div>
      )}
      <NavBar />
    </div>
  );
}
