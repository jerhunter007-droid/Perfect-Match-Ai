"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PAYMENTS_ENABLED } from "@/lib/config";

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setLoading(true);
    setError("");
    track("upgrade_clicked");
    const { data, error: fnErr } = await supabase.functions.invoke("create-checkout-session", {
      body: { origin: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    setLoading(false);
    if (fnErr || !data?.url) { setError(data?.error ?? "Payments aren't set up yet."); return; }
    window.location.href = data.url;
  }

  if (!PAYMENTS_ENABLED) {
    return (
      <div className="flex flex-col min-h-[90vh]">
        <button onClick={() => router.back()} className="text-muted text-xl mb-4 w-9 h-9 flex items-center justify-center -ml-2">←</button>
        <p className="text-cyanDim text-xs tracking-widest font-mono mb-1">PERFECT MATCH+</p>
        <h2 className="text-2xl mb-6">Coming soon.</h2>
        <div className="bg-surface border border-line rounded-2xl p-5 mb-6">
          <p className="text-sm leading-relaxed">
            Perfect Match+ isn&apos;t open yet. During the beta launch everyone gets <b>15 Potential Matches every 24 hours</b> and <b>1 search location</b> for free — we&apos;ll let you know when Perfect Match+ becomes available.
          </p>
        </div>
        <button onClick={() => router.push("/account")} className="w-full rounded-full py-4 font-semibold text-base border border-line text-bone">Back to account</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[90vh]">
      <button onClick={() => router.back()} className="text-muted text-xl mb-4 w-9 h-9 flex items-center justify-center -ml-2">←</button>
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-1">PERFECT MATCH+</p>
      <h2 className="text-2xl mb-6">Meet more people you&apos;d actually like.</h2>

      <div className="bg-surface border border-line rounded-2xl p-5 mb-6">
        <p className="text-sm leading-relaxed mb-4">
          Unlock <b>30 Potential Matches</b> on a <b>10 hour cycle</b> instead of <b>15 Potential Matches every 24 hours</b> with a <b>free subscription</b>.
          Perfect Match+ members can also find Potential Matches in up to <b>3 locations worldwide</b> — match with people abroad, not just nearby.
        </p>
        <p className="text-2xl">$5.99 <span className="text-xs text-muted font-mono">first month</span></p>
        <p className="text-xs text-muted font-mono">then $10.99/mo</p>
      </div>

      <button onClick={upgrade} disabled={loading} className="w-full rounded-full py-4 font-semibold text-base bg-cyan text-void disabled:opacity-50">
        {loading ? "Redirecting to checkout…" : "Continue to payment"}
      </button>
      {error && <p className="text-red text-xs mt-3 font-mono">{error}</p>}
    </div>
  );
}
