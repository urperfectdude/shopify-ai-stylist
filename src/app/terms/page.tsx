export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-300">
          <p>
            AI Stylist is provided to Shopify merchants as a paid application for
            storefront outfit recommendations and try-on experiences.
          </p>
          <p>
            Merchants are responsible for ensuring they have the right to use product
            content and shopper-submitted media with the app. The app may use third
            party AI providers to generate try-on previews and styling outputs.
          </p>
          <p>
            Access to merchant features may be gated by billing status. Misuse,
            abuse, or attempts to bypass platform restrictions may result in service
            suspension.
          </p>
          <p>
            For support or contractual questions, contact `support@aistylist.com`.
          </p>
        </div>
      </div>
    </main>
  );
}
