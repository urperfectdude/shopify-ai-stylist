import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { billingConfig, calculateDiscountedPrice, formatBillingAmount, isBillingActive } from "@/lib/billing";
import { loadMerchantContext } from "@/lib/merchant-context";

type BillingPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth");
  }

  const { error, success } = await searchParams;
  const context = await loadMerchantContext(session);
  const pricing = calculateDiscountedPrice(context.coupon, context.redemption);
  const billingActive = isBillingActive(context.installRecord);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-sm text-fuchsia-200">
              Paid merchant access
            </span>
            <h1 className="text-4xl font-semibold tracking-tight">Activate AI Stylist billing</h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-300">
              Merchant billing is required before the control plane unlocks. Coupon
              redemption happens here and only affects the merchant install, never
              the storefront shopper experience.
            </p>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </section>
        ) : null}

        {success ? (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {success}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Subscription summary</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-200">
              <p>
                <span className="text-neutral-400">Shop:</span> {context.shopSnapshot?.myshopifyDomain ?? session.shop}
              </p>
              <p>
                <span className="text-neutral-400">Plan:</span> {billingConfig.planName}
              </p>
              <p>
                <span className="text-neutral-400">Base price:</span>{" "}
                {formatBillingAmount(pricing.baseAmount, billingConfig.currencyCode)}
              </p>
              <p>
                <span className="text-neutral-400">Discount:</span>{" "}
                {pricing.discountAmount > 0
                  ? `${formatBillingAmount(pricing.discountAmount, billingConfig.currencyCode)} via ${pricing.couponCode}`
                  : "None"}
              </p>
              <p>
                <span className="text-neutral-400">Amount due:</span>{" "}
                {formatBillingAmount(pricing.finalAmount, billingConfig.currencyCode)}
              </p>
              <p>
                <span className="text-neutral-400">Billing status:</span>{" "}
                {String(context.installRecord?.billing_status ?? "pending")}
              </p>
              <p>
                <span className="text-neutral-400">Mode:</span>{" "}
                {billingConfig.testMode ? "Shopify test billing" : "Live billing"}
              </p>
              {context.installRecord?.billing_confirmation_url ? (
                <p>
                  <a
                    className="text-cyan-300 underline underline-offset-4"
                    href={context.installRecord.billing_confirmation_url}
                  >
                    Resume Shopify billing approval
                  </a>
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Coupon</h2>
            <form action="/billing/redeem" className="mt-4 flex flex-col gap-3" method="post">
              <input
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                name="code"
                placeholder="Enter coupon code"
                type="text"
              />
              <button
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950"
                type="submit"
              >
                Redeem coupon
              </button>
            </form>
            <p className="mt-4 text-sm text-neutral-300">
              Current coupon: {pricing.couponCode ?? "None applied"}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-medium">Activation</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-300">
            Approving billing keeps merchant management secure while storefront users
            remain guest-first. If a coupon reduces the price to zero, activation is
            completed instantly without a Shopify approval redirect.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {billingActive ? (
              <Link
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-neutral-950"
                href="/app"
              >
                Open merchant control plane
              </Link>
            ) : (
              <form action="/billing/activate" method="post">
                <button
                  className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
                  type="submit"
                >
                  {pricing.finalAmount <= 0 ? "Activate with coupon" : "Approve Shopify subscription"}
                </button>
              </form>
            )}
            <Link
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
              href="/auth/logout"
            >
              Log out merchant
            </Link>
          </div>
        </section>

        {context.shopError || context.supabaseError ? (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {context.shopError ?? context.supabaseError}
          </section>
        ) : null}
      </div>
    </main>
  );
}
