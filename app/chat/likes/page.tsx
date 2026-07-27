"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

type Liker = {
  liker_profile_id: string;
  name: string;
  photo_url: string | null;
  liked_at: string;
};

export default function WhoLikedMePage() {
  const router = useRouter();
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      track("who_liked_me_viewed");

      const { data } = await supabase.rpc("who_liked_me");
      setLikers(data ?? []);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="relative pb-24 min-h-[100dvh]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/chat" className="text-muted text-lg w-9 h-9 flex items-center justify-center -ml-2">✕</Link>
        <p className="text-base text-bone">
          {likers.length} {likers.length === 1 ? "person likes" : "people like"} you
        </p>
      </div>

      {likers.length === 0 ? (
        <p className="text-muted text-sm text-center mt-10">No likes yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {likers.map((l) => (
            <div key={l.liker_profile_id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-line bg-raised">
              {l.photo_url ? (
                <img src={l.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-lg scale-110" />
              ) : (
                <div className="absolute inset-0 bg-raised" />
              )}
              <div className="absolute inset-0 bg-void/20" />
              <span className="absolute bottom-2 right-2 text-cyan text-sm" aria-hidden="true">♥</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-muted text-xs text-center mt-6">Match with them to reveal who they are.</p>
    </div>
  );
}
