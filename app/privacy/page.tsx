// app/privacy/page.tsx
//
// Legal content only -- drafted by Claude, NOT reviewed by a lawyer.
// See the callout box at the top of the rendered page and the notes
// throughout marked "NEEDS LEGAL REVIEW" before treating this as final.
// Search this file for SUPPORT_EMAIL_PLACEHOLDER and replace with your
// real support address before publishing.

export const metadata = {
  title: "Privacy Policy — Perfect Match",
};

const SUPPORT_EMAIL_PLACEHOLDER = "support@perfectmatchai.org";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-200 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: [DATE]</p>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-4 mb-10 text-sm text-amber-200">
          This policy has not yet been reviewed by a lawyer. Sections most in
          need of that review are marked below. Do not treat this page as
          finished legal advice.
        </div>

        <Section n="1" title="Who We Are">
          <P>
            Perfect Match (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) operates the Perfect Match
            dating application available at perfectmatchai.org (the
            &ldquo;Service&rdquo;). This Privacy Policy explains what information we
            collect, how we use it, who we share it with, and the choices you
            have.
          </P>
          <P>
            By using the Service, you agree to the collection and use of
            information in accordance with this policy.
          </P>
        </Section>

        <Section n="2" title="Information We Collect">
          <P><B>Account information.</B> When you sign up, we collect your email
            address. We do not use passwords — access is via a one-time code
            sent to your email.</P>
          <P><B>Profile information.</B> Name, age, city, height, gender, bio,
            lifestyle preferences, relationship goals, education, and
            interests you choose to share.</P>
          <P><B>Photos.</B> Photos you upload to your profile.</P>
          <P><B>Identity verification.</B> A live selfie taken during signup,
            compared against your profile photo using AI, to confirm you are
            a real person. This verification selfie is deleted immediately
            after the comparison is complete — we do not retain it.</P>
          <P><B>Age verification.</B> A photo of a government-issued ID, used
            to confirm you meet our 18+ requirement. We extract only a
            pass/fail result — we do not store your date of birth, ID
            number, or any other field from the document. The ID photo is
            deleted immediately after verification, regardless of outcome.</P>
          <P><B>Messages.</B> Content of messages you exchange with matches.</P>
          <P><B>Payment information.</B> If you subscribe, payment is
            processed by Stripe. We do not store your card details.</P>
          <P><B>Technical information.</B> IP address (for rate-limiting and
            abuse prevention), device/browser information, general usage
            logs.</P>
          <P><B>Reports and safety data.</B> If you report or block another
            user, we retain a record to support safety review.</P>
        </Section>

        <Section n="3" title="How We Use Your Information">
          <Ul items={[
            "To create and operate your account and profile",
            "To generate compatibility matches and conversation-starter suggestions",
            "To verify your identity and age",
            "To enable messaging between matched users",
            "To detect and prevent fraud, impersonation, spam, and abuse",
            "To process payments for paid subscriptions",
            "To communicate with you about your account",
            "To comply with legal obligations",
          ]} />
        </Section>

        <Section n="4" title="AI Processing — Please Read">
          <Callout>Legal review recommended for this section specifically.</Callout>
          <P>We use Anthropic&rsquo;s Claude AI to:</P>
          <Ul items={[
            "Score compatibility between users based on profile information to generate match suggestions",
            "Generate personalized compatibility summaries and conversation-starter suggestions",
            "Compare your verification selfie against your profile photo, and verify government ID during age verification",
            "Generate a brief, neutral internal descriptor of general visual style (never shared with other users, never includes race, ethnicity, or age)",
          ]} />
          <P>
            Match scores and compatibility descriptions are AI-generated
            estimates, not guarantees of compatibility.
          </P>
        </Section>

        <Section n="5" title="Who We Share Information With">
          <P>We share information with the following service providers, each processing data only as necessary to provide their service to us:</P>
          <table className="w-full text-sm my-4 border-collapse">
            <tbody>
              {[
                ["Supabase", "Database, authentication, and file storage hosting"],
                ["Vercel", "Application hosting"],
                ["Anthropic", "AI-powered matching, compatibility summaries, and identity/age verification"],
                ["Stripe", "Payment processing"],
                ["Resend", "Delivery of sign-in and account emails"],
              ].map(([name, purpose]) => (
                <tr key={name} className="border-b border-slate-700">
                  <td className="py-2 pr-4 font-semibold text-white">{name}</td>
                  <td className="py-2 text-slate-300">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <P>We do not sell your personal information.</P>
        </Section>

        <Section n="6" title="Data Retention">
          <Ul items={[
            "Verification selfies and ID documents: deleted immediately after processing, in all cases.",
            "Account and profile data: retained while your account is active.",
            "Messages: retained while the relevant match exists; deleted if either party unmatches or deletes their account.",
            "Deleted accounts: profile, photos, messages, and associated data are permanently deleted.",
          ]} />
        </Section>

        <Section n="7" title="Your Rights">
          <Ul items={[
            "Access and edit most of your profile information directly in the app.",
            "Delete your account at any time from account settings.",
            `Request a copy of your data by contacting us at ${SUPPORT_EMAIL_PLACEHOLDER}.`,
          ]} />
        </Section>

        <Section n="8" title="Data Security">
          <P>
            We use industry-standard measures including encryption in
            transit and at rest, database-level access controls, and
            rate-limiting and abuse-detection systems. No system is 100%
            secure.
          </P>
        </Section>

        <Section n="9" title="International Users, GDPR, and CCPA">
          <Callout>Legal review required for this section before publishing if you expect users outside the United States, or California residents.</Callout>
          <P>
            If you are located in the EEA, UK, or similar jurisdictions, you
            may have rights under GDPR including access, correction,
            deletion, and portability of your data.
          </P>
          <P>
            If you are a California resident, you may have rights under the
            CCPA/CPRA, including the right to know what information is
            collected and to request deletion. We do not sell personal
            information.
          </P>
        </Section>

        <Section n="10" title="Age Requirement">
          <P>
            The Service is for users 18 years of age and older only,
            verified through government ID. If we determine an account
            belongs to someone under 18, the account and all associated
            data are deleted immediately.
          </P>
        </Section>

        <Section n="11" title="Changes to This Policy">
          <P>We may update this Privacy Policy from time to time.</P>
        </Section>

        <Section n="12" title="Contact Us">
          <P>Questions about this policy can be directed to: {SUPPORT_EMAIL_PLACEHOLDER}</P>
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
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
      ⚠️ {children}
    </div>
  );
}
