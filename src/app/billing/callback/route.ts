import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { loadMerchantContext } from "@/lib/merchant-context";
import { getActiveAppSubscription } from "@/lib/shopify-admin";
import { updateBillingRedemption, updateMerchantInstall } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth?error=missing_billing_session", request.url));
  }

  const context = await loadMerchantContext(session);

  if (!context.shopSnapshot || !context.installRecord) {
    return NextResponse.redirect(
      new URL("/billing?error=Merchant%20install%20is%20not%20ready", request.url),
    );
  }

  try {
    const activeSubscription = await getActiveAppSubscription({
      shop: session.shop,
      accessToken: session.accessToken,
    });

    if (!activeSubscription) {
      await updateMerchantInstall(context.shopSnapshot.myshopifyDomain, {
        billing_status: "pending",
      });

      return NextResponse.redirect(
        new URL("/billing?error=Subscription%20was%20not%20activated", request.url),
      );
    }

    await updateMerchantInstall(context.shopSnapshot.myshopifyDomain, {
      billing_status: "active",
      billing_subscription_id: activeSubscription.id,
      billing_plan_name: activeSubscription.name,
      billing_interval: activeSubscription.interval,
      billing_amount: activeSubscription.amount,
      billing_currency: activeSubscription.currencyCode,
      billing_confirmation_url: null,
      billing_activated_at: new Date().toISOString(),
    });

    if (context.redemption) {
      await updateBillingRedemption(context.redemption.id, {
        status: "applied",
        applied_amount: activeSubscription.amount,
      });
    }

    return NextResponse.redirect(new URL("/app?billing=active", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify Shopify billing";

    return NextResponse.redirect(
      new URL(`/billing?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
