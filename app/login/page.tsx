"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { PHONE_AUTH_ENABLED } from "@/lib/config";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/TurnstileWidget";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [value, setValue] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    track("signup_started");
  }, []);

  function switchMethod(m: "phone" | "email") {
    setMethod(m);
    setCodeSent(false);
    setValue("");
    setError("");
  }

  async function sendCode() {
    if (!ageConfirmed || !termsAccepted) { setError("Please confirm you're 18+ and agree to the Terms and Privacy Policy."); return; }
    if (!value.trim()) { setError(`Enter your ${method === "phone" ? "phone number" : "email"} first.`); return; }
    // Turnstile completes automatically for legitimate users, usually within
    // a second or two, but isn't guaranteed to have finished the instant the
    // button is clicked. Catching that here avoids sending a captcha-less
    // request to Supabase and surfacing its generic rejection instead of a
    // clear, specific message.
    if (!captchaToken) { setError("Please complete the verification check above."); return; }
    setLoading(true);
    setError("");
    const { error } = method === "phone"
      ? await supabase.auth.signInWithOtp({ phone: value.trim(), options: { captchaToken } })
      : await supabase.auth.signInWithOtp({ email: value.trim(), options: { captchaToken } });
    setLoading(false);
    if (error) {
      // Turnstile tokens are single-use — Cloudflare invalidates them after
      // one verification attempt regardless of whether the underlying
      // request succeeded. Reset here so the next attempt gets a fresh one
      // instead of retrying with an already-spent token.
      turnstileRef.current?.reset();
      setCaptchaToken(undefined);
      setError(method === "phone" ? "Phone sign-in isn't fully set up yet — try email for now." : error.message);
      return;
    }
    setCodeSent(true);
    track("contact_code_sent", { method });
  }

  async function verifyCode() {
    setLoading(true);
    setError("");
    const { data, error } = method === "phone"
      ? await supabase.auth.verifyOtp({ phone: value.trim(), token: code, type: "sms" })
      : await supabase.auth.verifyOtp({ email: value.trim(), token: code, type: "email" });
    setLoading(false);
    if (error || !data.user) { setError(error?.message ?? "That code didn't work."); return; }
    track("contact_verified", { method });

    await supabase.from("profiles").update({
      contact_method: method,
      contact_verified: true,
      terms_accepted_at: new Date().toISOString(),
    }).eq("id", data.user.id);

    const { data: profile } = await supabase.from("profiles").select("onboarding_status").eq("id", data.user.id).single();
    if (profile?.onboarding_status === "active") router.push("/matches");
    else if (profile?.onboarding_status === "pending_verification") router.push("/verify-identity");
    else if (profile?.onboarding_status === "pending_age_verification") router.push("/verify-age");
    else router.push("/onboarding");
  }

  return (
    <div className="flex flex-col min-h-[90vh]">
      <p className="text-cyanDim text-xs tracking-widest font-mono">STEP 1 · VERIFY IT&apos;S YOU</p>
      <h2 className="text-2xl mt-2 mb-1.5">Let&apos;s confirm how to reach you.</h2>
      <p className="text-muted text-sm mb-6">
        {PHONE_AUTH_ENABLED
          ? "Every account needs a verified phone number or email before it can go live."
          : "Every account needs a verified email before it can go live."}
      </p>

      {PHONE_AUTH_ENABLED && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => switchMethod("phone")} className={`flex-1 rounded-full py-2.5 text-xs font-semibold border ${method === "phone" ? "bg-cyan text-void border-cyan" : "bg-surface text-bone border-line"}`}>Phone</button>
          <button onClick={() => switchMethod("email")} className={`flex-1 rounded-full py-2.5 text-xs font-semibold border ${method === "email" ? "bg-cyan text-void border-cyan" : "bg-surface text-bone border-line"}`}>Email</button>
        </div>
      )}

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type={method === "phone" ? "tel" : "email"}
        inputMode={method === "phone" ? "tel" : "email"}
        autoComplete={method === "phone" ? "tel" : "email"}
        placeholder={method === "phone" ? "+15551234567" : "you@email.com"}
        disabled={codeSent}
        className="w-full rounded-md px-3 py-3 text-base bg-surface border border-line text-bone outline-none mb-4 min-h-[44px]"
      />

      {!codeSent && (
        <div className="space-y-2.5 mb-4">
          <label className="flex items-start gap-2.5 text-xs text-muted">
            <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
            <span>I confirm I am 18 years of age or older.</span>
          </label>
          <label className="flex items-start gap-2.5 text-xs text-muted">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
            <span>I agree to the <Link href="/terms" className="text-cyan underline">Terms of Service</Link> and <Link href="/privacy" className="text-cyan underline">Privacy Policy</Link>.</span>
          </label>
        </div>
      )}

      {!codeSent && (
        <div className="mb-4">
          <TurnstileWidget ref={turnstileRef} onVerify={setCaptchaToken} />
        </div>
      )}

      {!codeSent ? (
        <button onClick={sendCode} disabled={loading} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void disabled:opacity-50 min-h-[44px]">
          {loading ? "Sending…" : "Send verification code"}
        </button>
      ) : (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className="w-full rounded-md px-3 py-3 text-center text-xl tracking-[0.3em] bg-surface border border-line text-bone outline-none mb-3 min-h-[44px]"
          />
          <button onClick={verifyCode} disabled={loading || code.length !== 6} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void disabled:opacity-50 min-h-[44px]">
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
        </>
      )}
      {error && <p className="text-red text-xs mt-3 font-mono">{error}</p>}
    </div>
  );
}
