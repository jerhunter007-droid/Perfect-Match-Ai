"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { compressImage } from "@/lib/compressImage";

const POSE_PROMPTS = [
  "Hold up 2 fingers next to your face",
  "Give a thumbs up",
  "Touch your ear",
  "Hold up 3 fingers",
  "Point up toward the ceiling",
  "Cover one eye with your hand",
];

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [pose, setPose] = useState(() => POSE_PROMPTS[Math.floor(Math.random() * POSE_PROMPTS.length)]);
  const [userId, setUserId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"not_started" | "analyzing" | "verified" | "failed">("not_started");
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [notes, setNotes] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
    });
    track("identity_verification_viewed");
  }, [router]);

  async function capture(file: File | undefined) {
    if (!file || !userId) return;
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("analyzing");

    // Slightly higher quality than the profile-photo default since this one
    // feeds the AI face-comparison check, not just browsing thumbnails.
    const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.88 });
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadErr } = await supabase.storage.from("verification-photos").upload(path, compressed);
    if (uploadErr) { setError("Couldn't upload that photo — please try again."); setStatus("not_started"); return; }

    const { data, error: fnErr } = await supabase.functions.invoke("verify-photo", { body: { path, pose } });
    if (fnErr) { setError("Verification service is unavailable right now — try again."); setStatus("not_started"); return; }

    if (data.verified) {
      setStatus("verified");
      setFlagged(!!data.flaggedForReview);
      track("identity_verified", { degraded: !!data.degraded, flagged: !!data.flaggedForReview });
    } else {
      setStatus("failed");
      setNotes(data.notes || "");
      setAttemptsRemaining(data.attemptsRemaining ?? 0);
      setPose(POSE_PROMPTS[Math.floor(Math.random() * POSE_PROMPTS.length)]);
      track("identity_verification_failed", { attempts_remaining: data.attemptsRemaining });
    }
  }

  function retry() {
    setStatus("not_started");
    setPreviewUrl(null);
  }

  function enterApp() {
    router.push("/verify-age");
  }

  return (
    <div className="flex flex-col min-h-[90vh]">
      <p className="text-cyanDim text-xs tracking-widest font-mono">STEP 3 · VERIFY IT&apos;S REALLY YOU</p>
      <h2 className="text-2xl mt-2 mb-1.5">One live photo to finish.</h2>
      <p className="text-muted text-sm mb-6 leading-relaxed">
        This confirms you&apos;re a real person, not a stolen or AI-generated photo — it&apos;s what keeps everyone else on here real too.
      </p>

      <div className="bg-surface border border-line rounded-2xl p-5 flex-1 flex flex-col items-center justify-center text-center">
        {status === "not_started" && (
          <>
            <div className="bg-raised rounded-lg px-3 py-2 mb-5">
              <p className="text-cyan text-sm font-mono">&quot;{pose}&quot;</p>
            </div>
            <label className="rounded-full px-5 py-3 bg-cyan text-void text-sm font-semibold cursor-pointer min-h-[44px] flex items-center">
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => capture(e.target.files?.[0])} />
              Take verification photo
            </label>
          </>
        )}
        {status === "analyzing" && (
          <>
            {previewUrl && <img src={previewUrl} alt="" className="w-24 h-32 object-cover rounded-lg mb-4" />}
            <p className="text-cyan text-xs font-mono min-h-[16px]">CHECKING YOUR PHOTO…</p>
          </>
        )}
        {status === "failed" && (
          <>
            {previewUrl && <img src={previewUrl} alt="" className="w-24 h-32 object-cover rounded-lg mb-4 opacity-60" />}
            <p className="text-red text-sm mb-1">Couldn&apos;t confirm that one.</p>
            {notes && <p className="text-muted text-xs mb-4">{notes}</p>}
            <p className="text-muted text-[11px] font-mono mb-4">{attemptsRemaining} {attemptsRemaining === 1 ? "try" : "tries"} left</p>
            <button onClick={retry} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void min-h-[44px]">Try again</button>
          </>
        )}
        {status === "verified" && (
          <>
            {previewUrl && <img src={previewUrl} alt="" className="w-24 h-32 object-cover rounded-lg mb-4" />}
            <p className="text-bone text-sm mb-1">Matched your profile photos and passed the check.</p>
            {flagged && <p className="text-muted text-xs mb-4">We couldn&apos;t confirm this automatically after a few tries, so it&apos;s been queued for a quick manual look — you&apos;re good to continue in the meantime.</p>}
            <button onClick={enterApp} className="w-full rounded-full py-3.5 font-semibold text-sm bg-cyan text-void mt-4 min-h-[44px]">Continue</button>
          </>
        )}
      </div>
      {error && <p className="text-red text-xs mt-3 font-mono">{error}</p>}
    </div>
  );
}
