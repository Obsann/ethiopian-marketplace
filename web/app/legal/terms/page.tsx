export default function TermsPage() {
  return (
    <div className="page-shell max-w-2xl space-y-6 pt-24 sm:pt-28 pb-16">
      <p className="eyebrow">Legal</p>
      <h1 className="font-display text-display font-medium">Terms of use</h1>
      <p className="text-sm leading-relaxed text-muted">
        SuqET is a demo marketplace for buying and selling used goods in Ethiopia. Listings are
        posted by users. SuqET is not the seller. Checkout in this demo uses Chapa TEST (or an
        in-app mock). “Held” and “released” update our database. They do not automatically pay a
        seller or reverse a bank transfer.
      </p>
      <p className="text-sm leading-relaxed text-muted">
        Do not post illegal items. Meet in public places. Inspect the item before you pay in cash
        at meetup. Report suspicious listings from the listing page.
      </p>
    </div>
  );
}
