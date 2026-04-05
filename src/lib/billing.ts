import type { BillingCoupon, BillingRedemption, MerchantInstall } from "./supabase-admin";

export const billingConfig = {
  planName: process.env.SHOPIFY_BILLING_PLAN_NAME?.trim() || "AI Stylist Pro",
  amount: Number(process.env.SHOPIFY_BILLING_AMOUNT ?? "29"),
  currencyCode: process.env.SHOPIFY_BILLING_CURRENCY?.trim() || "USD",
  interval: process.env.SHOPIFY_BILLING_INTERVAL?.trim() || "EVERY_30_DAYS",
  testMode: process.env.SHOPIFY_BILLING_TEST_MODE?.trim() !== "false",
} as const;

export function isBillingActive(install: MerchantInstall | null): boolean {
  return install?.billing_status === "active";
}

export function calculateDiscountedPrice(
  coupon: BillingCoupon | null,
  redemption: BillingRedemption | null,
) {
  const baseAmount = billingConfig.amount;

  if (!coupon || !redemption) {
    return {
      baseAmount,
      finalAmount: baseAmount,
      discountAmount: 0,
      couponCode: null,
      discountType: null,
      discountValue: null,
    };
  }

  const discountAmount =
    coupon.discount_type === "percentage"
      ? (baseAmount * coupon.discount_value) / 100
      : coupon.discount_value;

  const finalAmount = Math.max(0, Number((baseAmount - discountAmount).toFixed(2)));

  return {
    baseAmount,
    finalAmount,
    discountAmount: Number((baseAmount - finalAmount).toFixed(2)),
    couponCode: coupon.code,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
  };
}

export function formatBillingAmount(amount: number, currencyCode = billingConfig.currencyCode) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}
