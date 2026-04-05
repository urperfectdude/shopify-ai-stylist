import Link from "next/link";
import { env } from "@/lib/env";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { error } = await searchParams;
  const shop = env.shopDomain;
  const loginHref = shop ? `/auth/login?shop=${encodeURIComponent(shop)}` : "/auth/login";

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <span className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
          Merchant auth only
        </span>
        <h1 className="text-3xl font-semibold">Connect AI Stylist to Shopify admin</h1>
        <p className="text-sm leading-6 text-neutral-300">
          Merchants authenticate here so billing, shop tenancy, product access,
          and AI configuration can be handled securely. Storefront shoppers do not
          go through any separate auth flow.
        </p>
        {error ? (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
            href={loginHref}
          >
            Continue with Shopify
          </Link>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
            href="/"
          >
            Back to dashboard
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
          <p>Configured shop domain: {shop || "Not set in env"}</p>
          <p className="mt-2">Configured app URL: {env.shopifyAppUrl}</p>
        </div>
      </div>
    </main>
  );
}
