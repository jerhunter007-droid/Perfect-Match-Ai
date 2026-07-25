"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/analytics";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature idea" },
  { value: "general", label: "General" },
];

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function openModal() {
    setOpen(true);
    setSent(false);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    setLoggedIn(!!session);
  }

  async function submit() {
    if (!message.trim()) { setError("Add a quick note first."); return; }
    setSubmitting(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const { error: insertErr } = await supabase.from("feedback").insert({
      profile_id: session?.user.id ?? null,
      email: session ? null : (email.trim() || null),
      category,
      message: message.trim(),
    });
    setSubmitting(false);
    if (insertErr) { setError("Couldn't send that — try again in a moment."); return; }
    track("feedback_submitted", { category });
    setSent(true);
    setMessage("");
    setEmail("");
    setTimeout(() => setOpen(false), 1800);
  }

  return (
    <>
      <button
        onClick={openModal}
        className="w-full flex items-center justify-between bg-surface border border-line rounded-xl p-3.5 text-sm text-left"
      >
        Send feedback <span className="text-muted">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-void/95 flex items-end" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md mx-auto bg-surface rounded-t-2xl p-5"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <p className="text-cyan text-sm font-mono text-center py-6">THANKS — GOT IT</p>
            ) : (
              <>
                <p className="text-cyan text-sm font-mono mb-1">SEND FEEDBACK</p>
                <p className="text-muted text-xs mb-4">Bugs, ideas, anything that's bugging you — goes straight to us.</p>
                <div className="flex gap-2 mb-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`flex-1 rounded-full py-2 text-xs font-semibold border ${category === c.value ? "bg-cyan text-void border-cyan" : "bg-raised text-bone border-line"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="What's going on?"
                  className="w-full rounded-md px-3 py-3 text-base bg-raised border border-line text-bone outline-none resize-none mb-3"
                />
                {loggedIn === false && (
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email (optional, if you want a reply)"
                    className="w-full rounded-md px-3 py-3 text-base bg-raised border border-line text-bone outline-none mb-3"
                  />
                )}
                {error && <p className="text-red text-xs mb-3 font-mono">{error}</p>}
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full rounded-full py-3 font-semibold text-sm bg-cyan text-void disabled:opacity-50 mb-2"
                >
                  {submitting ? "Sending…" : "Send"}
                </button>
                <button onClick={() => setOpen(false)} className="w-full rounded-full py-2.5 text-sm text-muted border border-line">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
