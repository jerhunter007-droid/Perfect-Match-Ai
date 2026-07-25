"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { BETA_END_DATE, formatBetaDate } from "@/lib/beta";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChecking(false);
        track("landing_viewed");
        return;
      }
      // Already signed in on this device (e.g. tapping the home-screen icon
      // again) — skip straight past the marketing screen instead of making
      // a returning user tap "Log in" and re-verify.
      const { data: profile } = await supabase.from("profiles").select("onboarding_status").eq("id", session.user.id).single();
      if (profile?.onboarding_status === "active") router.replace("/matches");
      else if (profile?.onboarding_status === "pending_verification") router.replace("/verify-identity");
      else if (profile?.onboarding_status === "pending_age_verification") router.replace("/verify-age");
      else router.replace("/onboarding");
    })();
  }, [router]);

  if (checking) return <div className="flex items-center justify-center min-h-[80vh] text-muted text-xs font-mono">LOADING…</div>;

  return (
    <div className="flex flex-col min-h-[90vh]">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-cyan/10 border border-cyan flex items-center justify-center mb-6">
          <span className="text-4xl">♥</span>
        </div>
        <img src="/pm-logo.png" alt="Perfect Match" className="w-64" />
        <p className="text-cyan mt-2 text-sm">AI-powered matchmaking.</p>
        <p className="text-muted text-sm">The future of dating.</p>
        <p className="text-muted text-sm mt-6 max-w-xs leading-relaxed">
          Matched on your bio, your lifestyle, and what you actually care about — not just a photo grid.
        </p>
        <p className="text-muted text-[11px] font-mono mt-4">LIMITED BETA · OPEN THROUGH {formatBetaDate(BETA_END_DATE).toUpperCase()}</p>
      </div>
      <div className="space-y-3">
        <Link
          href="/login"
          onClick={() => track("cta_clicked", { cta: "create_account" })}
          className="block w-full text-center rounded-full py-4 font-semibold text-base bg-cyan text-void"
        >
          Join the beta
        </Link>
        <Link
          href="/login"
          onClick={() => track("cta_clicked", { cta: "log_in" })}
          className="block w-full text-center rounded-full py-4 font-semibold text-base border border-line text-bone"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
