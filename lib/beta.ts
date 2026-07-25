// Beta launch window.
//
// The app shows a holding screen before BETA_START_DATE and a "beta has
// ended" screen after BETA_END_DATE. To move either date, just edit the
// strings below and redeploy — no other code changes needed.
//
// Dates are inclusive: the beta is open on both BETA_START_DATE and
// BETA_END_DATE themselves, and gated on the days outside that range.
// Comparisons use each visitor's local calendar date (not UTC), so the
// cutover happens at midnight in their own timezone.
export const BETA_START_DATE = "2026-08-01"; // launch day
export const BETA_END_DATE = "2026-10-15"; // last day the beta is open

function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type BetaStatus = "before" | "active" | "ended";

export function getBetaStatus(): BetaStatus {
  const today = todayLocal();
  if (today < BETA_START_DATE) return "before";
  if (today > BETA_END_DATE) return "ended";
  return "active";
}

export function formatBetaDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
