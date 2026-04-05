import { NextResponse } from "next/server";
import { sanitizeShopDomain, shopify } from "@/lib/shopify";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shop = sanitizeShopDomain(url.searchParams.get("shop"));

  if (!shop) {
    return NextResponse.redirect(new URL("/auth?error=missing_shop", request.url));
  }

  const response = await shopify.auth.begin({
    shop,
    callbackPath: "/auth/callback",
    isOnline: false,
    rawRequest: request,
  });

  return new Response(response.body, {
    status: response.statusCode,
    headers: response.headers ?? {},
  });
}
