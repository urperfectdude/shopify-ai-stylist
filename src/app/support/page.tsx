export default function SupportPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-4xl font-semibold tracking-tight">Support</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-300">
          <p>
            Need help with installation, billing, theme block setup, or try-on image
            generation? Contact AI Stylist support.
          </p>
          <p>Email: `support@aistylist.com`</p>
          <p>
            Recommended support details to include:
          </p>
          <p>
            Shopify shop domain, app environment URL, affected product handle, and a
            short summary of the issue.
          </p>
        </div>
      </div>
    </main>
  );
}
