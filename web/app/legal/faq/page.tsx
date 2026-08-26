export default function FaqPage() {
  return (
    <div className="page-shell max-w-2xl space-y-8 pt-24 sm:pt-28 pb-16">
      <div>
        <p className="eyebrow">Help</p>
        <h1 className="mt-3 font-display text-display font-medium">FAQ</h1>
      </div>
      {[
        {
          q: 'How do I pay?',
          a: 'Buy Now lets you pay with Telebirr, CBE Birr, or card. Your order is tracked in the app until you and the seller confirm the handoff.',
        },
        {
          q: 'Meetup or delivery?',
          a: 'Each listing says if the seller will meet you or send the item. Delivery fee is listed in ETB when offered. Confirm details in chat.',
        },
        {
          q: 'Is my money protected?',
          a: 'After you pay, SuqET holds the order. Once you confirm meetup or delivery, funds are released to the seller.',
        },
        {
          q: 'How do reviews work?',
          a: 'After a purchase is released (completed), the buyer can rate the seller from Orders. Ratings show on the seller’s public profile.',
        },
        {
          q: 'How do I save items?',
          a: 'Tap the heart on a listing. Saved items stay on this device. If you are signed in, they also sync to your account.',
        },
        {
          q: 'What does reserved mean?',
          a: 'The seller marked the item as held for a buyer. It is not in the public shop until they unreserve or mark it sold.',
        },
        {
          q: 'Why email instead of SMS?',
          a: 'Sign-in uses email confirmation and Google. Phone is on your profile so sellers can reach you about meetup.',
        },
        {
          q: 'How do I change language?',
          a: 'Use the language control in the header (Amharic, Afaan Oromo, Tigrinya, English).',
        },
      ].map((item) => (
        <section key={item.q}>
          <h2 className="font-display text-xl font-medium">{item.q}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
        </section>
      ))}
    </div>
  );
}
