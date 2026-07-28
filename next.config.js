/** @type {import('next').NextConfig} */

// CSP in report-only mode first, deliberately: a misconfigured enforcing
// CSP can silently break real functionality (the Supabase realtime chat
// websocket, API calls, etc.) with no visible error beyond "the app stopped
// working." Report-only logs violations to the browser console without
// blocking anything, so this can be watched for a while and adjusted
// before ever switching to the enforcing header. Once it's run clean,
// change the header name below from Content-Security-Policy-Report-Only to
// Content-Security-Policy to actually enforce it.
//
// img-src is scoped tightly to this project's own Supabase storage rather
// than a blanket https: allowance, since profile_photos.url is now
// constrained (via a database CHECK constraint) to only ever point there
// anyway — the two fixes reinforce each other.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://sapjuniymdsyjyodnurk.supabase.co data:",
  "font-src 'self' data:",
  "connect-src 'self' https://sapjuniymdsyjyodnurk.supabase.co wss://sapjuniymdsyjyodnurk.supabase.co https://api.anthropic.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera=(self) allows verify-photo's live selfie capture to keep
          // working — this restricts it to your own origin rather than
          // blocking it outright, which a naive "deny everything" policy
          // would have broken. microphone and geolocation are explicitly
          // denied since nothing in this app uses either.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Content-Security-Policy-Report-Only", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
