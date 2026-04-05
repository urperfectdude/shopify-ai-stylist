import { NextResponse } from "next/server";
import type { GuestStyleProfile } from "@/lib/guest-session";
import { fetchShopifyCatalogProducts } from "@/lib/shopify-catalog";
import {
  buildAddOnRecommendations,
  buildCartIntentPreview,
  type StorefrontProductInput,
} from "@/lib/storefront-ai";

type AddOnRequest = {
  shop?: string | null;
  handle?: string | null;
  selectedProductIds?: string[] | null;
  profile?: Partial<GuestStyleProfile>;
  products?: StorefrontProductInput[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AddOnRequest;
  let products = body.products;
  let source = "request";

  try {
    if (body.handle) {
      products = await fetchShopifyCatalogProducts({
        shop: body.shop,
        first: 12,
      });
      source = "shopify_admin";
    }
  } catch {
    source = "fallback";
  }

  const addOns = buildAddOnRecommendations({
    products,
    selectedProductIds: body.selectedProductIds,
    profile: body.profile ?? {},
  });
  const cartLines = buildCartIntentPreview({
    products,
    selectedProductIds: body.selectedProductIds,
  });

  return NextResponse.json({
    ok: true,
    source,
    addOns,
    cartLines,
  });
}
