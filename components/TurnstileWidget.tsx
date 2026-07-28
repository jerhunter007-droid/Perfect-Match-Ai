"use client";

// Cloudflare Turnstile CAPTCHA widget, wired for Supabase Auth's built-in
// CAPTCHA support (signup / signin / password reset). Drop this into any
// auth form and pass the resulting token as the `captchaToken` option on
// the corresponding supabase.auth.* call — Supabase verifies it server-side
// once the Secret Key is configured in the dashboard (Settings >
// Authentication > Bot and Abuse Protection).
//
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is safe to expose client-side by design —
// it's the public counterpart to the Secret Key, which lives only in the
// Supabase dashboard and never touches this app's code. If the env var
// isn't set yet, this renders nothing rather than breaking the form, so
// signup/signin keep working exactly as they do today until Cloudflare and
// Supabase are both configured.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export type TurnstileWidgetHandle = {
  getToken: () => string | undefined;
  reset: () => void;
};

type TurnstileWidgetProps = {
  onVerify?: (token: string) => void;
  className?: string;
};

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, className }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const instanceRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      getToken: () => instanceRef.current?.getResponse(),
      reset: () => instanceRef.current?.reset(),
    }));

    if (!siteKey) return null;

    return (
      <div className={className}>
        <Turnstile
          ref={instanceRef}
          siteKey={siteKey}
          options={{ theme: "dark" }}
          onSuccess={onVerify}
        />
      </div>
    );
  }
);

export default TurnstileWidget;
