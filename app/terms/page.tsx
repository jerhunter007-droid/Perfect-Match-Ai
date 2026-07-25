export default function TermsPage() {
  return (
    <div className="pb-10 text-sm leading-relaxed">
      <p className="text-cyanDim text-xs tracking-widest font-mono mb-4">TERMS OF SERVICE — BETA</p>
      <h1 className="text-2xl mb-4">Perfect Match Beta Terms</h1>
      <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}. This is a limited beta. These terms are intentionally short for the beta period and will be replaced with full terms before public launch.</p>

      <h2 className="text-lg mt-6 mb-2">1. Eligibility</h2>
      <p className="mb-4">You must be at least 18 years old to create an account. By signing up, you confirm you meet this requirement. To enforce this, we also require a photo of a government-issued ID during signup to confirm your age — see the Privacy Policy for how that photo is handled. If we determine an account belongs to someone under 18, that account and its data are removed immediately.</p>

      <h2 className="text-lg mt-6 mb-2">2. Your content</h2>
      <p className="mb-4">You're responsible for what you post — your photos, bio, and messages. Don't impersonate someone else, post content you don't have rights to, or use another person's photos without consent.</p>

      <h2 className="text-lg mt-6 mb-2">3. AI matching</h2>
      <p className="mb-4">Perfect Match uses AI to score compatibility and generate match explanations based on the information you provide. Matching is a recommendation, not a guarantee — use your own judgment when meeting people.</p>

      <h2 className="text-lg mt-6 mb-2">4. Beta status</h2>
      <p className="mb-4">This is a beta product. Features may change, break, or be removed without notice. We may reach out to beta users for feedback.</p>

      <h2 className="text-lg mt-6 mb-2">5. Conduct</h2>
      <p className="mb-4">No harassment, hate speech, threats, or illegal content. We may suspend or remove accounts that violate this or make other users feel unsafe. Use the block and report tools if someone violates these terms.</p>

      <h2 className="text-lg mt-6 mb-2">6. Safety</h2>
      <p className="mb-4">Perfect Match does not conduct criminal background checks on members. Always meet new people in public places and tell a friend where you're going.</p>

      <h2 className="text-lg mt-6 mb-2">7. Account deletion</h2>
      <p className="mb-4">You can delete your account and all associated data at any time from your Account page.</p>
    </div>
  );
}
