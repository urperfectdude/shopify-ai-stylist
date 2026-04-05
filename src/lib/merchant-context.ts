import { env } from "./env";
import { getShopifyAdminSnapshot } from "./shopify-admin";
import {
  getBillingCoupon,
  getBillingRedemptionForShop,
  getMerchantInstall,
  supabaseAdminEnabled,
  tenantIdFromShop,
  upsertMerchantTenant,
  type BillingCoupon,
  type BillingRedemption,
  type MerchantInstall,
} from "./supabase-admin";

type MerchantSession = {
  shop: string;
  accessToken: string;
};

export async function loadMerchantContext(session: MerchantSession): Promise<{
  tenantId: string;
  shopSnapshot: Awaited<ReturnType<typeof getShopifyAdminSnapshot>> | null;
  shopError: string | null;
  installRecord: MerchantInstall | null;
  supabaseError: string | null;
  coupon: BillingCoupon | null;
  redemption: BillingRedemption | null;
}> {
  let shopSnapshot: Awaited<ReturnType<typeof getShopifyAdminSnapshot>> | null = null;
  let shopError: string | null = null;

  try {
    shopSnapshot = await getShopifyAdminSnapshot({
      shop: session.shop,
      accessToken: session.accessToken,
    });
  } catch (error) {
    shopError = error instanceof Error ? error.message : "Unable to load Shopify shop data";
  }

  const tenantId = tenantIdFromShop(shopSnapshot?.myshopifyDomain ?? session.shop);

  let installRecord: MerchantInstall | null = null;
  let supabaseError: string | null = null;
  let coupon: BillingCoupon | null = null;
  let redemption: BillingRedemption | null = null;

  if (shopSnapshot && supabaseAdminEnabled) {
    const upsertResult = await upsertMerchantTenant({
      shopDomain: shopSnapshot.myshopifyDomain,
      shopName: shopSnapshot.shopName,
      accessToken: session.accessToken,
      scopes: env.shopifyScopes,
    });

    if (upsertResult.error) {
      supabaseError = upsertResult.error;
    } else {
      const installResult = await getMerchantInstall(shopSnapshot.myshopifyDomain);
      installRecord = installResult.data;
      supabaseError = installResult.error;

      if (installRecord?.billing_discount_code) {
        const couponResult = await getBillingCoupon(installRecord.billing_discount_code);
        coupon = couponResult.data;
        supabaseError = supabaseError ?? couponResult.error;
      }

      const redemptionResult = await getBillingRedemptionForShop(shopSnapshot.myshopifyDomain);
      redemption = redemptionResult.data;
      supabaseError = supabaseError ?? redemptionResult.error;

      if (!coupon && redemption?.code) {
        const couponResult = await getBillingCoupon(redemption.code);
        coupon = couponResult.data;
        supabaseError = supabaseError ?? couponResult.error;
      }
    }
  }

  return {
    tenantId,
    shopSnapshot,
    shopError,
    installRecord,
    supabaseError,
    coupon,
    redemption,
  };
}
