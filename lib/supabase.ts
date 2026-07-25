import { createClient } from "@supabase/supabase-js";

// The anon/publishable key is meant to be public — Row Level Security in the
// database is the actual security boundary, not this key. Real secrets
// (service role key, Anthropic key) never appear in frontend code; they live
// only in the generate-stack Edge Function's server-side environment.
const SUPABASE_URL = "https://sapjuniymdsyjyodnurk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GZC51cN9ONAq2SD2SOgj2A_Cdy07ye5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
