import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { billingConfig, calculateDiscountedPrice } from "@/lib/billing";
import { env } from "@/lib/env";
import { loadMerchantContext } from "@/lib/merchant-context";
import { createAppSubscription, getActiveAppSubscription } from "@/lib/shopify-admin";
import { updateBillingRedemption, updateMerchantInstall } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const context = await loadMerchantContext(session);

  if (!context.shopSnapshot || !context.installRecord) {
    return NextResponse.redirect(
      new URL("/billing?error=Merchant%20install%20is%20not%20ready", request.url),
    );
  }

  const activeSubscription = await getActiveAppSubscription({
    shop: session.shop,
    accessToken: session.accessToken,
  });

  if (activeSubscription) {
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

    return NextResponse.redirect(new URL("/app", request.url));
  }

  const pricing = calculateDiscountedPrice(context.coupon, context.redemption);

  if (pricing.finalAmount <= 0) {
    const activationTimestamp = new Date().toISOString();

    await updateMerchantInstall(context.shopSnapshot.myshopifyDomain, {
      billing_status: "active",
      billing_plan_name: billingConfig.planName,
      billing_interval: billingConfig.interval,
      billing_amount: pricing.finalAmount,
      billing_currency: billingConfig.currencyCode,
      billing_discount_code: pricing.couponCode,
      billing_discount_type: pricing.discountType,
      billing_discount_value: pricing.discountValue,
      billing_confirmation_url: null,
      billing_subscription_id: null,
      billing_activated_at: activationTimestamp,
    });

    if (context.redemption) {
      await updateBillingRedemption(context.redemption.id, {
        status: "applied",
        applied_amount: pricing.finalAmount,
      });
    }

    return NextResponse.redirect(new URL("/app?billing=active", request.url));
  }

  try {
    const subscriptionResult = await createAppSubscription({
      shop: session.shop,
      accessToken: session.accessToken,
      planName: billingConfig.planName,
      amount: pricing.finalAmount,
      currencyCode: billingConfig.currencyCode,
      interval: billingConfig.interval,
      returnUrl: `${env.shopifyAppUrl}/billing/callback`,
      test: billingConfig.testMode,
    });

    await updateMerchantInstall(context.shopSnapshot.myshopifyDomain, {
      billing_status: "pending",
      billing_plan_name: billingConfig.planName,
      billing_interval: billingConfig.interval,
      billing_amount: pricing.finalAmount,
      billing_currency: billingConfig.currencyCode,
      billing_discount_code: pricing.couponCode,
      billing_discount_type: pricing.discountType,
      billing_discount_value: pricing.discountValue,
      billing_confirmation_url: subscriptionResult.confirmationUrl,
      billing_subscription_id: subscriptionResult.subscriptionId,
    });

    if (!subscriptionResult.confirmationUrl) {
      return NextResponse.redirect(
        new URL("/billing?error=Shopify%20did%20not%20return%20a%20confirmation%20URL", request.url),
      );
    }

    return NextResponse.redirect(subscriptionResult.confirmationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Shopify billing";

    return NextResponse.redirect(
      new URL(`/billing?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
