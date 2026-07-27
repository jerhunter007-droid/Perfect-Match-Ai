"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PAYMENTS_ENABLED } from "@/lib/config";

type Breakdown = {
  summary: string;
  icebreaker: string;
  smart_openers: string[];
  date_idea: string;
  cached?: boolean;
};

export default function AiBreakdownPanel({
  vieweeId,
  isPremium,
  gatesEnabled,
}: {
  vieweeId: string;
  isPremium: boolean;
  gatesEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Breakdown | null>(null);
  const [error, setError] = useState("");

  const allowed = !gatesEnabled || isPremium;

  async function load() {
    if (data || loading) { setOpen((o) => !o); return; }
    setOpen(true);
    setLoading(true);
    setError("");
    const { data: result, error: fnErr } = await supabase.functions.invoke("ai-breakdown", { body: { viewee_id: vieweeId } });
    setLoading(false);
    if (fnErr || result?.error) { setError(result?.error || "Couldn't load the breakdown — try again."); return; }
    setData(result);
    track("ai_breakdown_viewed", { viewee_id: vieweeId, cached: !!result.cached });
  }

  if (!allowed) {
    return (
      <div className="bg-raised rounded-xl p-3 mt-3">
        <p className="text-cyan text-xs font-mono mb-1">AI BREAKDOWN</p>
        <p className="text-xs text-muted">
          {PAYMENTS_ENABLED ? (
            <><Link href="/upgrade" className="text-cyan underline">Upgrade to Perfect Match+</Link> to see your AI compatibility breakdown.</>
          ) : (
            "Perfect Match+ is coming soon and will include a full AI compatibility breakdown."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-raised rounded-xl p-3 mt-3">
      <button onClick={load} className="w-full flex items-center justify-between">
        <p className="text-cyan text-xs font-mono">AI BREAKDOWN</p>
        <span className="text-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {loading && <p className="text-muted text-xs font-mono">ANALYZING COMPATIBILITY…</p>}
          {error && <p className="text-red text-xs">{error}</p>}
          {data && (
            <>
              <p className="text-sm leading-relaxed">{data.summary}</p>
              <div>
                <p className="text-[11px] text-muted mb-1">AI ICEBREAKER</p>
                <p className="text-sm bg-surface border border-line rounded-lg p-2.5">{data.icebreaker}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted mb-1">MORE OPENERS</p>
                <div className="space-y-2">
                  {data.smart_openers.map((o, i) => (
                    <p key={i} className="text-sm bg-surface border border-line rounded-lg p-2.5">{o}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted mb-1">DATE IDEA</p>
                <p className="text-sm">{data.date_idea}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
