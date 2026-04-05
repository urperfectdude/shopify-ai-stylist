import { NextResponse } from "next/server";
import type { GuestStyleProfile } from "@/lib/guest-session";
import { fetchShopifyCatalogProducts } from "@/lib/shopify-catalog";
import { buildOutfitResult, type StorefrontProductInput, type StorefrontSurface } from "@/lib/storefront-ai";

type OutfitRequest = {
  surface?: StorefrontSurface;
  shop?: string | null;
  handle?: string | null;
  seedProductId?: string | null;
  profile?: Partial<GuestStyleProfile>;
  products?: StorefrontProductInput[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as OutfitRequest;
  let products = body.products;
  let source = "request";

  try {
    if (body.surface === "product" && body.handle) {
      products = await fetchShopifyCatalogProducts({
        shop: body.shop,
        handle: body.handle,
        first: 1,
      });
      source = "shopify_admin";
    } else if (body.surface === "collection" && (!products || !products.length)) {
      products = await fetchShopifyCatalogProducts({
        shop: body.shop,
        first: 12,
      });
      source = "shopify_admin";
    }
  } catch {
    source = "fallback";
  }

  const result = buildOutfitResult({
    surface: body.surface ?? "product",
    products,
    seedProductId: body.seedProductId ?? null,
    profile: body.profile ?? {},
  });

  return NextResponse.json({
    ok: true,
    source,
    generatedAt: new Date().toISOString(),
    ...result,
  });
}
