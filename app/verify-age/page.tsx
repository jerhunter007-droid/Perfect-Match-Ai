"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { compressImage } from "@/lib/compressImage";

type Status = "not_started" | "analyzing" | "verified" | "failed" | "blocked" | "pending_review";

export default function VerifyAgePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("not_started");
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
    });
    track("age_verification_viewed");
  }, [router]);

  async function capture(file: File | undefined) {
    if (!file || !userId) return;
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("analyzing");

    // Higher quality than profile photos — the printed date of birth needs
    // to stay legible after compression.
    const compressed = await compressImage(file, { maxDimension: 2000, quality: 0.9 });
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadErr } = await supabase.storage.from("age-verification-documents").upload(path, compressed);
    if (uploadErr) { setError("Couldn't upload that photo — please try again."); setStatus("not_started"); return; }

    const { data, error: fnErr } = await supabase.functions.invoke("verify-age", { body: { path } });
    if (fnErr) { setError("Verification service is unavailable right now — try again."); setStatus("not_started"); return; }

    if (data.blocked) {
      // Account has already been deleted server-side. Nothing left to sign
      // out of that matters, but clear the local session anyway.
      track("age_verification_blocked");
      await supabase.auth.signOut();
      setStatus("blocked");
      return;
    }

    if (data.verified) {
      setStatus("verified");
      track("age_verified", { flagged: !!data.flaggedForReview });
      return;
    }

    if (data.pendingReview) {
      setStatus("pending_review");
      setNotes(data.notes || "");
      track("age_verification_pending_review");
      return;
    }

    setStatus("failed");
    setNotes(data.notes || "");
    setAttemptsRemaining(data.attemptsRemaining ?? 0);
    track("age_verification_failed", { attempts_remaining: data.attemptsRemaining });
  }

  function retry() {
    setStatus("not_started");
    setPreviewUrl(null);
  }

  function enterApp() {
    router.push("/matches");
  }

  return (
    <div className="flex flex-col min-h-[90vh]">
      <p className="text-cyanDim text-xs tracking-widest font-mono">STEP 4 · CONFIRM YOU&apos;RE 18+</p>
      <h2 className="text-2xl mt-2 mb-1.5">One more thing — an ID check.</h2>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        Perfect Match is 18+ only. A quick photo of a government-issued ID (driver&apos;s license, passport, or state ID) confirms your age — we read the date of birth to check you&apos;re 18 or older, then delete the photo immediately. We never store the ID image or the date itself.
      </p>

      <div className="bg-surface border border-line rounded-2xl p-5 flex-1 flex flex-col items-center justify-center text-center">
        {status === "not_started" && (
          <>
            <div className="bg-raised rounded-lg px-4 py-3 mb-5 text-left">
              <p className="text-cyan text-xs font-mono mb-1">FOR A CLEAN READ</p>
              <p className="text-bone text-xs leading-relaxed">Flat surface, good light, all four corners visible, no glare over the date of birth.</p>
            </div>
            <label className="rounded-full px-5 py-3 bg-cyan text-void text-sm font-semibold cursor-pointer min-h-[44px] flex items-center">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => capture(e.target.files?.[0])} />
              Take a photo of your ID
            </label>
          </>
        )}

        {status === "analyzing" && (
          <>
            {previewUrl && <img src={previewUrl} alt="" className="w-32 h-20 object-cover rounded-lg mb-4" />}
            <p className="text-cyan text-xs font-mono min-h-[16px]">CHECKING YOUR ID…</p>
          </>
        )}

        {status === "failed" && (
          <>
            {previewUrl && <img src={previewUrl} alt="" className="w-32 h-20 object-cover rounded-lg mb-4 opacity-60" />}
            <p className="text-red text-sm mb-1">Couldn&apos;t confirm that one.</p>
            {notes && <p className="text-muted text-xs mb-4">{notes}</p>}
            <p className="text-muted text-[11px] font-mono mb-4">{attemptsRemaining} {attemptsRemaining === 1 ? "try" : "tries"} left</p>
            <button onClick={retry} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void min-h-[44px]">Try again</button>
          </>
        )}

        {status === "pending_review" && (
          <>
            <p className="text-bone text-sm mb-1">Your ID is queued for a quick manual check.</p>
            <p className="text-muted text-xs leading-relaxed">{notes || "We couldn't confirm this automatically after a few tries. A real person will review it shortly — no need to keep retrying."}</p>
          </>
        )}

        {status === "blocked" && (
          <>
            <p className="text-red text-sm mb-1">We couldn&apos;t verify you&apos;re 18 or older.</p>
            <p className="text-muted text-xs leading-relaxed">Perfect Match is for adults only, so this account has been removed. If you believe this is a mistake, reach out through the feedback link on our site.</p>
          </>
        )}

        {status === "verified" && (
          <>
            <p className="text-bone text-sm mb-1">You&apos;re verified.</p>
            <p className="text-muted text-xs mb-4">Age confirmed — the ID photo has already been deleted.</p>
            <button onClick={enterApp} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void mt-4 min-h-[44px]">Enter Perfect Match</button>
          </>
        )}
      </div>
      {error && <p className="text-red text-xs mt-3 font-mono">{error}</p>}
    </div>
  );
}
