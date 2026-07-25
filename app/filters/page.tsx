"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PAYMENTS_ENABLED } from "@/lib/config";

export default function FiltersPage() {
  const router = useRouter();
  const [ageMin, setAgeMin] = useState(22);
  const [ageMax, setAgeMax] = useState(45);
  const [maxDistance, setMaxDistance] = useState(25);
  const [seeking, setSeeking] = useState<"men" | "women" | "everyone">("everyone");
  const [isPremium, setIsPremium] = useState(false);
  const [locations, setLocations] = useState<{ id: string; city: string }[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadLocations(userId: string) {
    const { data } = await supabase.from("search_locations").select("id, city").eq("profile_id", userId);
    setLocations(data ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("search_filters").select("*").eq("profile_id", session.user.id).maybeSingle();
      if (data) {
        setAgeMin(data.age_min); setAgeMax(data.age_max); setMaxDistance(data.max_distance); setSeeking(data.seeking);
      }
      const { data: sub } = await supabase.from("subscriptions").select("status").eq("profile_id", session.user.id).maybeSingle();
      setIsPremium(sub?.status === "active");
      await loadLocations(session.user.id);
      setLoading(false);
    })();
  }, [router]);

  async function addLocation() {
    if (!newLocation.trim()) return;
    const maxLocations = isPremium ? 3 : 1;
    if (locations.length >= maxLocations) {
      setLocationError(isPremium ? "You've used all 3 locations." : (PAYMENTS_ENABLED ? "Upgrade to Perfect Match+ to search up to 3 locations worldwide." : "Perfect Match+ is coming soon and will let you search up to 3 locations worldwide."));
      return;
    }
    setLocationError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from("search_locations").insert({ profile_id: session.user.id, city: newLocation.trim() }).select("id, city").single();
    if (error) { setLocationError(error.message); return; }
    setLocations((prev) => [...prev, data]);
    setNewLocation("");
    track("location_added");
  }

  async function removeLocation(id: string) {
    // never allow removing down to zero — matching needs at least one city
    if (locations.length <= 1) { setLocationError("You need at least one search location."); return; }
    await supabase.from("search_locations").delete().eq("id", id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
    track("location_removed");
  }

  async function save() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("search_filters").upsert({
      profile_id: session.user.id, age_min: ageMin, age_max: ageMax, max_distance: maxDistance, seeking,
    });
    setSaving(false);
    track("filters_updated", { age_min: ageMin, age_max: ageMax, max_distance: maxDistance, seeking });
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
          <label className="text-xs text-muted">Search locations</label>
          <span className="text-xs font-mono text-muted">{locations.length}/{isPremium ? 3 : 1}</span>
        </div>
        <div className="space-y-2 mb-2">
          {locations.map((l) => (
            <div key={l.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-3 py-2.5">
              <span className="text-sm">{l.city}</span>
              <button onClick={() => removeLocation(l.id)} className="text-muted text-lg w-8 h-8 flex items-center justify-center">×</button>
            </div>
          ))}
        </div>
        {(isPremium ? locations.length < 3 : locations.length < 1) && (
          <div className="flex gap-2">
            <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="City, State/Country" className="flex-1 rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none min-h-[44px]" />
            <button onClick={addLocation} className="rounded-full px-4 bg-raised border border-line text-bone text-xs font-semibold min-h-[44px]">Add</button>
          </div>
        )}
        {!isPremium && locations.length >= 1 && (
          <p className="text-[11px] text-muted mt-2">
            {PAYMENTS_ENABLED ? (
              <><Link href="/upgrade" className="text-cyan underline">Upgrade to Perfect Match+</Link> to search up to 3 locations worldwide.</>
            ) : (
              "Perfect Match+ is coming soon and will let you search up to 3 locations worldwide."
            )}
          </p>
        )}
        {isPremium && (
          <p className="text-[11px] text-muted mt-2">Add cities anywhere in the world — great for matching with people abroad.</p>
        )}
        {locationError && <p className="text-red text-xs mt-2 font-mono">{locationError}</p>}
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
      </div>

      <button onClick={save} disabled={saving} className="w-full rounded-full py-4 font-semibold text-base bg-cyan text-void disabled:opacity-50 min-h-[44px]">
        {saving ? "Saving…" : "Apply — start a new scan"}
      </button>
      <p className="text-muted text-[11px] text-center mt-3">This starts a fresh stack using your new filters.</p>
    </div>
  );
}
