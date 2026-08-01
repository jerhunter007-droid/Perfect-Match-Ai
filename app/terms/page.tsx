// app/terms/page.tsx
//
// Legal content only -- drafted by Claude, NOT reviewed by a lawyer.
// Sections 9, 10, and 11 in particular are placeholder shape, not final
// language -- see the callouts on the rendered page. Search this file for
// SUPPORT_EMAIL_PLACEHOLDER and replace with your real support address.

export const metadata = {
  title: "Terms of Service — Perfect Match",
};

const SUPPORT_EMAIL_PLACEHOLDER = "support@perfectmatchai.org";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-200 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: [DATE]</p>

        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 mb-10 text-sm text-red-200">
          This document has not been reviewed by a lawyer. Sections 9
          (Limitation of Liability), 10 (Indemnification), and 11 (Dispute
          Resolution) are placeholder shape only — get these reviewed before
          relying on them for anything real.
        </div>

        <Section n="1" title="Acceptance of Terms">
          <P>
            By creating an account or using Perfect Match (the
            &ldquo;Service&rdquo;), you agree to these Terms of Service and our
            Privacy Policy. If you do not agree, do not use the Service.
          </P>
        </Section>

        <Section n="2" title="Eligibility">
          <Ul items={[
            "You must be 18 years of age or older, verified via government ID.",
            "You must not have been previously banned from the Service.",
            "You may maintain only one account.",
            "You must provide accurate information — impersonation and fake profiles are prohibited.",
          ]} />
        </Section>

        <Section n="3" title="Your Account">
          <P>
            You are responsible for all activity under your account.
            Notify us immediately if you suspect unauthorized access.
          </P>
        </Section>

        <Section n="4" title="Prohibited Conduct">
          <P>You agree not to:</P>
          <Ul items={[
            "Harass, threaten, stalk, or abuse other users",
            "Impersonate any person or misrepresent your identity, age, or affiliation",
            "Post or send unlawful, obscene, hateful, or discriminatory content",
            "Solicit money, gifts, or financial information from other users",
            "Promote another business, product, or service without our consent",
            "Upload photos of anyone other than yourself without consent",
            "Attempt to access another user's account or data without authorization",
            "Use automated tools to access the Service",
            "Attempt to circumvent our verification or safety systems",
            "Use the Service if required to register as a sex offender in any jurisdiction",
          ]} />
          <P>Violation may result in immediate termination and, where appropriate, reporting to law enforcement.</P>
        </Section>

        <Section n="5" title="Content You Provide">
          <P>
            You retain ownership of content you upload. By uploading, you
            grant us a non-exclusive, worldwide, royalty-free license to
            store, display, and process it as necessary to operate the
            Service.
          </P>
        </Section>

        <Section n="6" title="Verification">
          <P>
            Core features require completing identity verification (live
            selfie) and age verification (government ID). We may flag
            accounts for manual review in ambiguous cases. We reserve the
            right to suspend or terminate accounts that fail verification
            or that we reasonably believe to be fraudulent.
          </P>
        </Section>

        <Section n="7" title="Matching Service Disclaimer">
          <P>
            Match suggestions and compatibility scores are AI-generated
            estimates only. We do not guarantee compatibility, chemistry,
            or any particular outcome from using the Service.
          </P>
        </Section>

        <Section n="8" title="Safety">
          <P>
            <B>Perfect Match does not conduct criminal background checks
            beyond identity and age verification, and cannot guarantee the
            conduct of any user.</B> You are solely responsible for your own
            safety when communicating with or meeting other users. We
            recommend meeting for the first time in a public place, telling
            someone where you&rsquo;re going, never sharing financial
            information with matches, and trusting your instincts.
          </P>
        </Section>

        <Section n="9" title="Disclaimers and Limitation of Liability">
          <Callout>Needs legal review — placeholder language only.</Callout>
          <P>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY
            KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PERFECT MATCH
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR
            CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE,
            INCLUDING DAMAGES RESULTING FROM INTERACTIONS WITH OTHER USERS.
          </P>
        </Section>

        <Section n="10" title="Indemnification">
          <Callout>Needs legal review — placeholder language only.</Callout>
          <P>
            You agree to indemnify and hold Perfect Match harmless from
            claims arising from your violation of these Terms or your
            misuse of the Service.
          </P>
        </Section>

        <Section n="11" title="Dispute Resolution and Governing Law">
          <Callout>Needs legal review — deliberately left minimal rather than guessed at. Arbitration clauses have jurisdiction-specific enforceability rules that shouldn't be drafted without a lawyer.</Callout>
        </Section>

        <Section n="12" title="Termination">
          <P>
            We may suspend or terminate your account at any time for
            violation of these Terms. You may delete your account at any
            time from account settings.
          </P>
        </Section>

        <Section n="13" title="Reporting and Safety Tools">
          <P>
            The Service provides tools to report profiles, photos, and
            messages, and to block other users.
          </P>
        </Section>

        <Section n="14" title="Changes to These Terms">
          <P>We may update these Terms from time to time. Continued use after changes take effect constitutes acceptance.</P>
        </Section>

        <Section n="15" title="Contact">
          <P>Questions can be directed to: {SUPPORT_EMAIL_PLACEHOLDER}</P>
        </Section>
      </div>
    </main>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-white mb-3">{n}. {title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 leading-relaxed">{children}</p>;
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-white">{children}</span>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 text-slate-300">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 mb-2">
      ⚠️ {children}
    </div>
  );
}
