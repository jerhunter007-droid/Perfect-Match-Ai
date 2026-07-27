"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PAYMENTS_ENABLED } from "@/lib/config";
import { COUNTRIES } from "@/lib/countries";

type Scope = "country" | "state" | "city" | "region";

const SCOPE_LABELS: Record<Scope, string> = {
  country: "Country",
  state: "State / Province",
  city: "City",
  region: "Region",
};

export default function FiltersPage() {
  const router = useRouter();
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(45);
  const [maxDistance, setMaxDistance] = useState(25);
  const [seeking, setSeeking] = useState<"men" | "women" | "everyone">("everyone");
  const [isPremium, setIsPremium] = useState(false);
  const [gatesEnabled, setGatesEnabled] = useState(false);
  const [everywhereEnabled, setEverywhereEnabled] = useState(false);
  const [everywhereScope, setEverywhereScope] = useState<Scope>("city");
  const [everywhereValue, setEverywhereValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const everywhereAllowed = !gatesEnabled || isPremium;

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase.from("search_filters").select("*").eq("profile_id", session.user.id).maybeSingle();
      if (data) {
        setAgeMin(data.age_min); setAgeMax(data.age_max); setMaxDistance(data.max_distance); setSeeking(data.seeking);
        setEverywhereEnabled(data.everywhere_enabled ?? false);
        setEverywhereScope((data.everywhere_scope as Scope) ?? "city");
        setEverywhereValue(data.everywhere_value ?? "");
      }
      const { data: sub } = await supabase.from("subscriptions").select("status").eq("profile_id", session.user.id).maybeSingle();
      setIsPremium(sub?.status === "active");
      const { data: gateSetting } = await supabase.from("app_settings").select("value").eq("key", "premium_gates_enabled").maybeSingle();
      setGatesEnabled(gateSetting?.value ?? false);
      setLoading(false);
    })();
  }, [router]);

  async function save() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("search_filters").upsert({
      profile_id: session.user.id,
      age_min: ageMin, age_max: ageMax, max_distance: maxDistance, seeking,
      everywhere_enabled: everywhereAllowed && everywhereEnabled,
      everywhere_scope: everywhereScope,
      everywhere_value: everywhereValue.trim() || null,
    });
    setSaving(false);
    track("filters_updated", { age_min: ageMin, age_max: ageMax, max_distance: maxDistance, seeking, everywhere_enabled: everywhereAllowed && everywhereEnabled });
    router.push("/matches?refresh=1");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="flex flex-col min-h-[90vh]">
      <button onClick={() => router.back()} className="text-muted text-xl mb-4 w-9 h-9 flex items-center justify-center -ml-2">←</button>
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-1">DISCOVERY SETTINGS</p>
      <h2 className="text-2xl mb-6">Who you want to see.</h2>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-muted">Everywhere Mode</label>
          {everywhereAllowed ? (
            <button
              onClick={() => setEverywhereEnabled((v) => !v)}
              className={`text-xs font-mono rounded-full px-3 py-1 border ${everywhereEnabled ? "bg-cyan text-void border-cyan" : "bg-surface text-muted border-line"}`}
            >
              {everywhereEnabled ? "ON" : "OFF"}
            </button>
          ) : (
            <span className="text-xs font-mono rounded-full px-3 py-1 border border-line text-muted">LOCKED</span>
          )}
        </div>

        {!everywhereAllowed && (
          <p className="text-[11px] text-muted mb-2">
            {PAYMENTS_ENABLED ? (
              <><Link href="/upgrade" className="text-cyan underline">Upgrade to Perfect Match+</Link> to search anywhere in the world.</>
            ) : (
              "Perfect Match+ is coming soon and will let you search anywhere in the world."
            )}
          </p>
        )}

        {everywhereAllowed && everywhereEnabled && (
          <div className="mt-3">
            <div className="flex gap-2 mb-2">
              {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setEverywhereScope(s)}
                  className={`flex-1 rounded-full py-2 text-[11px] font-semibold border ${everywhereScope === s ? "bg-cyan text-void border-cyan" : "bg-surface text-bone border-line"}`}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>

            {everywhereScope === "country" ? (
              <select
                value={everywhereValue}
                onChange={(e) => setEverywhereValue(e.target.value)}
                className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                value={everywhereValue}
                onChange={(e) => setEverywhereValue(e.target.value)}
                placeholder={everywhereScope === "state" ? "e.g. Illinois" : everywhereScope === "region" ? "e.g. Pacific Northwest" : "e.g. Las Vegas"}
                className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]"
              />
            )}
            <p className="text-[11px] text-muted mt-2">
              This replaces your usual nearby search with matches from this {SCOPE_LABELS[everywhereScope].toLowerCase()} only. Switch it off anytime to go back to your own city.
            </p>
          </div>
        )}

        {everywhereAllowed && !everywhereEnabled && (
          <p className="text-[11px] text-muted mt-2">Off — you're matched near your own city by default.</p>
        )}
      </div>

      <div className="mb-6">
        <label className="text-xs text-muted block mb-2">Show me</label>
        <div className="flex gap-2">
          {(["everyone", "men", "women"] as const).map((s) => (
            <button key={s} onClick={() => setSeeking(s)} className={`flex-1 rounded-full py-2.5 text-xs font-semibold border capitalize ${seeking === s ? "bg-cyan text-void border-cyan" : "bg-surface text-bone border-line"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs text-muted block mb-2">Age range: {ageMin} – {ageMax}</label>
        <div className="flex gap-3 items-center">
          <input type="range" min={18} max={99} value={ageMin} onChange={(e) => setAgeMin(Math.min(Number(e.target.value), ageMax - 1))} className="flex-1" />
          <input type="range" min={18} max={99} value={ageMax} onChange={(e) => setAgeMax(Math.max(Number(e.target.value), ageMin + 1))} className="flex-1" />
        </div>
      </div>

      <div className="mb-8">
        <label className="text-xs text-muted block mb-2">Max distance: {maxDistance} mi</label>
        <input type="range" min={1} max={100} value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full" />
        {everywhereAllowed && everywhereEnabled && <p className="text-[11px] text-muted mt-2">Ignored while Everywhere Mode is on.</p>}
      </div>

      <button onClick={save} disabled={saving} className="w-full rounded-full py-4 font-semibold text-base bg-cyan text-void disabled:opacity-50 min-h-[44px]">
        {saving ? "Saving…" : "Apply — start a new scan"}
      </button>
      <p className="text-muted text-[11px] text-center mt-3">This starts a fresh stack using your new filters.</p>
    </div>
  );
}
