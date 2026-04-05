import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-session";
import { env } from "@/lib/env";
import { getShopifyAdminSnapshot } from "@/lib/shopify-admin";
import { shopify } from "@/lib/shopify";
import { upsertMerchantTenant } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: request,
    });

    if (!session.accessToken) {
      return NextResponse.redirect(
        new URL("/auth?error=missing_access_token", env.shopifyAppUrl),
      );
    }

    await setAdminSession(session.shop, session.accessToken);
    const snapshot = await getShopifyAdminSnapshot({
      shop: session.shop,
      accessToken: session.accessToken,
    });

    await upsertMerchantTenant({
      shopDomain: snapshot.myshopifyDomain,
      shopName: snapshot.shopName,
      accessToken: session.accessToken,
      scopes: env.shopifyScopes,
    });

    return NextResponse.redirect(new URL(`/app?shop=${session.shop}`, env.shopifyAppUrl));
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth_callback_failed";
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(message)}`, env.shopifyAppUrl),
    );
  }
}
