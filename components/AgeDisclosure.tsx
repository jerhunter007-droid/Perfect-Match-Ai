// components/AgeDisclosure.tsx
//
// Drop this near the signup button on your login/landing page.
// Two variants included -- use whichever fits the available space.

export function AgeDisclosureShort() {
  return (
    <p className="text-xs text-slate-400 text-center mt-2">
      Perfect Match is for adults 18 and older only. We verify age using a
      government-issued ID during signup, and accounts belonging to anyone
      under 18 are removed immediately.
    </p>
  );
}

export function AgeDisclosureLong() {
  return (
    <div className="text-sm text-slate-300 space-y-2">
      <h3 className="font-semibold text-white">Age Requirement</h3>
      <p>
        Perfect Match is an 18+ platform. Everyone who creates an account is
        required to verify their age using a government-issued photo ID
        before they can use the app. We do not store your date of birth,
        your ID number, or any other information from the document itself
        — only a pass/fail confirmation, and the ID photo is deleted
        immediately after that check. If we determine an account belongs to
        someone under 18, it — and all associated data — is deleted
        immediately.
      </p>
    </div>
  );
}
