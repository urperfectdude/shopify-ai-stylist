export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-300">
          <p>
            AI Stylist processes merchant installation details, Shopify product data,
            and shopper-submitted try-on images to deliver storefront styling and
            try-on features.
          </p>
          <p>
            Shopper images uploaded through the try-on flow are stored in Supabase
            Storage buckets used solely for rendering and serving the requested try-on
            result. Merchant data is stored to support tenancy, billing, and product
            context retrieval.
          </p>
          <p>
            We do not require shopper account creation for the storefront experience.
            Privacy-law compliance requests from Shopify are handled through the app’s
            registered compliance webhooks.
          </p>
          <p>
            For privacy questions or deletion requests, contact
            `support@aistylist.com`.
          </p>
        </div>
      </div>
    </main>
  );
}
