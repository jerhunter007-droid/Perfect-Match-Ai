// app/community-guidelines/page.tsx

export const metadata = {
  title: "Community Guidelines — Perfect Match",
};

export default function CommunityGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-200 px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Community Guidelines</h1>
        <p className="text-slate-400 mb-10">
          These guidelines work alongside our{" "}
          <a href="/terms" className="text-pink-400 underline">Terms of Service</a>.
          Violating them may result in a warning, temporary restriction, or
          permanent ban.
        </p>

        <Section title="Be a real person">
          <P>
            Use your real photos, your real age, and real information about
            yourself. We verify identity and age for exactly this reason —
            accounts found to be fake, impersonating someone else, or
            misrepresenting who they are will be removed.
          </P>
        </Section>

        <Section title="Be respectful">
          <P>
            Disagreements and mismatched expectations happen — that&rsquo;s
            normal. Harassment, threats, hate speech, unwanted explicit
            content, and targeted abuse are not. If a conversation isn&rsquo;t
            working, unmatching is always available.
          </P>
        </Section>

        <Section title="No scams, no solicitation">
          <P>
            Don&rsquo;t use Perfect Match to sell anything, promote another
            app or service, or solicit money, gift cards, or financial
            information from other users. If someone asks you for money,
            screenshot it and report it immediately.
          </P>
        </Section>

        <Section title="Respect people's boundaries">
          <P>
            If someone stops responding or declines to meet, respect that.
            Persistent unwanted contact after someone has disengaged is
            harassment.
          </P>
        </Section>

        <Section title="Keep photos appropriate">
          <P>
            No nudity or sexually explicit images. No photos of anyone
            other than yourself without their consent. No violent or
            graphic content.
          </P>
        </Section>

        <Section title="Meet safely, if you choose to meet">
          <P>
            We verify identity and age, but we can&rsquo;t vouch for anyone&rsquo;s
            character. If you decide to meet: meet in public, tell someone
            where you&rsquo;re going, and trust your instincts.
          </P>
        </Section>

        <Section title="Report, don't retaliate">
          <P>
            If someone violates these guidelines, use the report tools in
            the app rather than confronting them yourself.
          </P>
        </Section>

        <Section title="What happens if these guidelines are violated">
          <P>
            Depending on severity, we may issue a warning, restrict an
            account, or permanently remove it. Severe violations —
            harassment, scams, content involving minors, or safety threats
            — result in immediate, permanent removal, and may be reported
            to law enforcement where appropriate.
          </P>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-300 leading-relaxed">{children}</p>;
}
