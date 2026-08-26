export default function PrivacyPage() {
  return (
    <div className="page-shell max-w-2xl space-y-6 pt-24 sm:pt-28 pb-16">
      <p className="eyebrow">Legal</p>
      <h1 className="font-display text-display font-medium">Privacy</h1>
      <p className="text-sm leading-relaxed text-muted">
        We store your name, email, phone, listings, messages, and order records to run the
        marketplace. KYC photos are private — they never appear on public listings. Session cookies
        are httpOnly. Secrets stay on the API, not in the website.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Do not upload identity documents you are not comfortable sharing for seller verification.
      </p>
    </div>
  );
}
