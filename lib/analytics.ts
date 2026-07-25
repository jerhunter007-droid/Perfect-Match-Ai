import { supabase } from "./supabase";

function anonymousId() {
  if (typeof window === "undefined") return null;
  const key = "pm_anon_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// Fire-and-forget event logging. Query the results with:
//   select * from funnel_summary;
//   select * from daily_active_users;
// in the Supabase SQL editor.
export async function track(eventName: string, properties: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      profile_id: user?.id ?? null,
      anonymous_id: user ? null : anonymousId(),
      properties,
    });
  } catch {
    // analytics must never break the app
  }
}
