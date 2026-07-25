"use client";
import { useEffect } from "react";

// Registers the service worker so the app qualifies for "Add to Home
// Screen" / install-banner treatment on Android, and so repeat visits
// load hashed static assets a bit faster. Fails silently — a missing
// service worker should never block the app itself.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
