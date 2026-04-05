import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { loadMerchantContext } from "@/lib/merchant-context";
import { getBillingCoupon, redeemBillingCoupon, updateMerchantInstall } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const formData = await request.formData();
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return NextResponse.redirect(
      new URL("/billing?error=Enter%20a%20coupon%20code", request.url),
    );
  }

  const context = await loadMerchantContext(session);

  if (!context.shopSnapshot || !context.installRecord) {
    return NextResponse.redirect(
      new URL("/billing?error=Merchant%20install%20is%20not%20ready", request.url),
    );
  }

  const redemptionResult = await redeemBillingCoupon({
    code,
    shopDomain: context.shopSnapshot.myshopifyDomain,
    tenantId: context.tenantId,
  });

  if (redemptionResult.error || !redemptionResult.data) {
    return NextResponse.redirect(
      new URL(`/billing?error=${encodeURIComponent(redemptionResult.error ?? "Coupon redemption failed")}`, request.url),
    );
  }

  const couponResult = context.coupon ? { data: context.coupon, error: null } : await getBillingCoupon(code);
  const couponData = couponResult.data;

  const updateResult = await updateMerchantInstall(context.shopSnapshot.myshopifyDomain, {
    billing_discount_code: redemptionResult.data.code,
    billing_discount_type: couponData?.discount_type ?? null,
    billing_discount_value: couponData?.discount_value ?? null,
    coupon_redeemed_at: redemptionResult.data.redeemed_at,
  });

  if (updateResult.error) {
    return NextResponse.redirect(
      new URL(`/billing?error=${encodeURIComponent(updateResult.error)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/billing?success=Coupon%20applied", request.url),
  );
}
