// Feature flags.
//
// PAYMENTS_ENABLED: flip to true once Stripe is fully wired up —
//   1. Supabase → Edge Functions → create-checkout-session → Secrets:
//      STRIPE_SECRET_KEY, STRIPE_PRICE_ID
//   2. Supabase → Edge Functions → stripe-webhook → Secrets:
//      STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   3. Stripe dashboard → Webhooks → add endpoint pointing at
//      https://sapjuniymdsyjyodnurk.supabase.co/functions/v1/stripe-webhook
// Until then, this keeps the Upgrade CTA out of the app so nobody hits a
// dead end trying to pay. Free-tier limits (10 matches/24h, 1 location)
// are unaffected either way — this only controls whether the paid upgrade
// path is shown.
export const PAYMENTS_ENABLED = false;

// PHONE_AUTH_ENABLED: flip to true once an SMS provider (e.g. Twilio) is
// configured under Supabase → Authentication → Phone. Until then, login is
// email-only — no phone toggle shown, so nobody hits the "not set up yet"
// error. Existing accounts are unaffected either way.
export const PHONE_AUTH_ENABLED = false;
