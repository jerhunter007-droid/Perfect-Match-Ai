export default function PrivacyPage() {
  return (
    <div className="pb-10 text-sm leading-relaxed">
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-4">PRIVACY POLICY — BETA</p>
      <h1 className="text-2xl mb-4">How we handle your data</h1>
      <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}. This is a beta-period policy and will be replaced with a full policy before public launch.</p>

      <h2 className="text-lg mt-6 mb-2">What we collect</h2>
      <p className="mb-4">Your profile info (name, age, city, bio, interests, the Basics fields), photos, a one-time identity verification photo, a one-time government ID photo used only to confirm your age, your email or phone number, messages you send within matches, and product usage events (page views, swipes, matches — used to understand how the beta is performing).</p>

      <h2 className="text-lg mt-6 mb-2">How we use it</h2>
      <p className="mb-4">To run the AI matching engine, show you and other members your profile, send verification codes, process Perfect Match+ payments through Stripe, and analyze aggregate usage to improve the product during the beta. Your identity verification photo is also used to generate a short internal style descriptor (hair color, build, general aesthetic — never race or ethnicity) that helps personalize the order of your own daily matches over time, based on patterns in who you've liked or passed on. This descriptor is never shown to you or any other user.</p>

      <h2 className="text-lg mt-6 mb-2">Your verification photo</h2>
      <p className="mb-4">Stored privately and never shown to other users — it's only used to confirm you're a real person during signup.</p>

      <h2 className="text-lg mt-6 mb-2">Your ID verification photo</h2>
      <p className="mb-4">During signup, we ask for a photo of a government-issued ID to confirm you're 18 or older. That photo is read once to check the date of birth printed on it, then deleted from our storage immediately — win or lose. We never save the photo itself, the date of birth, or any other field from the document; the only thing that persists is a yes/no result and the date it was checked. The ID photo is never shown to other users or used for anything other than this one check. If the check shows you're under 18, your account and all associated data are deleted right away rather than retained in any blocked or pending state.</p>

      <h2 className="text-lg mt-6 mb-2">Who can see what</h2>
      <p className="mb-4">Your profile photos, bio, interests, and Basics are visible to other active members for matching purposes. Your email/phone are never shown to other users.</p>

      <h2 className="text-lg mt-6 mb-2">Your controls</h2>
      <p className="mb-4">You can edit or delete your profile at any time, and block or report other users. Deleting your account permanently removes your profile, photos, and messages.</p>

      <h2 className="text-lg mt-6 mb-2">Third parties</h2>
      <p className="mb-4">We use Supabase for data storage and authentication, Anthropic's Claude for AI matching, and Stripe for payments. We don't sell your data.</p>
    </div>
  );
}
