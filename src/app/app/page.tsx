import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { isBillingActive } from "@/lib/billing";
import { loadMerchantContext } from "@/lib/merchant-context";
import { getActiveAppSubscription } from "@/lib/shopify-admin";
import { supabaseAdminEnabled, updateMerchantInstall } from "@/lib/supabase-admin";

export default async function AdminAppPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth");
  }

  const context = await loadMerchantContext(session);
  const { tenantId, shopSnapshot, shopError } = context;
  let { installRecord, supabaseError } = context;

  if (shopSnapshot && installRecord) {
    try {
      const activeSubscription = await getActiveAppSubscription({
        shop: session.shop,
        accessToken: session.accessToken,
      });

      if (activeSubscription && !isBillingActive(installRecord)) {
        const updateResult = await updateMerchantInstall(shopSnapshot.myshopifyDomain, {
          billing_status: "active",
          billing_subscription_id: activeSubscription.id,
          billing_plan_name: activeSubscription.name,
          billing_interval: activeSubscription.interval,
          billing_amount: activeSubscription.amount,
          billing_currency: activeSubscription.currencyCode,
          billing_confirmation_url: null,
          billing_activated_at: new Date().toISOString(),
        });

        installRecord = updateResult.data ?? installRecord;
        supabaseError = supabaseError ?? updateResult.error;
      }
    } catch (error) {
      supabaseError =
        supabaseError ??
        (error instanceof Error ? error.message : "Unable to sync billing status");
    }
  }

  if (supabaseAdminEnabled && shopSnapshot && !isBillingActive(installRecord)) {
    redirect("/billing");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
              Merchant session active
            </span>
            <h1 className="text-4xl font-semibold tracking-tight">
              AI Stylist merchant control plane
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-300">
              The merchant-authenticated area is now separate from the anonymous
              shopper flow. Storefront shoppers stay guest-first, while the
              merchant session controls billing, tenant ownership, and catalog
              access for this shop.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Current merchant context</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-200">
              <p>
                <span className="text-neutral-400">Shop:</span> {session.shop}
              </p>
              <p>
                <span className="text-neutral-400">Tenant ID:</span> {tenantId}
              </p>
              <p>
                <span className="text-neutral-400">Access token:</span>{" "}
                {session.accessToken ? "Stored in secure cookie" : "Missing"}
              </p>
              <p>
                <span className="text-neutral-400">Shopify shop data:</span>{" "}
                {shopSnapshot ? "Connected" : "Unavailable"}
              </p>
              <p>
                <span className="text-neutral-400">Billing status:</span>{" "}
                {String(installRecord?.billing_status ?? "pending")}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Actions</h2>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                href="/"
              >
                Open public dashboard
              </Link>
              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                href="/billing"
              >
                Open billing
              </Link>
              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                href="/auth/logout"
              >
                Log out merchant
              </Link>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Shopify snapshot</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-200">
              <p>
                <span className="text-neutral-400">Store name:</span>{" "}
                {shopSnapshot?.shopName ?? "Not loaded"}
              </p>
              <p>
                <span className="text-neutral-400">Plan:</span>{" "}
                {shopSnapshot?.planName ?? "Unknown"}
              </p>
              <p>
                <span className="text-neutral-400">Catalog products:</span>{" "}
                {shopSnapshot?.productCount ?? 0}
              </p>
              {shopError ? (
                <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100">
                  {shopError}
                </p>
              ) : null}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Tenant persistence</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-200">
              <p>
                <span className="text-neutral-400">Supabase admin:</span>{" "}
                {supabaseAdminEnabled ? "Configured" : "Missing service role config"}
              </p>
              <p>
                <span className="text-neutral-400">Install record:</span>{" "}
                {installRecord ? "Persisted" : "Pending"}
              </p>
              <p>
                <span className="text-neutral-400">Billing status:</span>{" "}
                {String(installRecord?.billing_status ?? "pending")}
              </p>
              <p>
                <span className="text-neutral-400">Subscription ID:</span>{" "}
                {String(installRecord?.billing_subscription_id ?? "Not assigned")}
              </p>
              {supabaseError ? (
                <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-100">
                  {supabaseError}
                </p>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
