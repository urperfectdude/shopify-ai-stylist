import { NextResponse } from "next/server";
import { fetchShopifyCatalogProducts } from "@/lib/shopify-catalog";
import { demoStorefrontCatalog, normalizeStorefrontProducts, type StorefrontProductInput } from "@/lib/storefront-ai";

type StorefrontContextRequest = {
  surface?: "home" | "collection" | "product";
  shop?: string;
  handle?: string;
  products?: StorefrontProductInput[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StorefrontContextRequest;
  let products = body.products ?? [];
  let source = "request";

  try {
    if (body.surface === "product" && body.handle) {
      products = await fetchShopifyCatalogProducts({
        shop: body.shop,
        handle: body.handle,
        first: 1,
      });
      source = "shopify_admin";
    } else if (body.surface === "collection") {
      products = await fetchShopifyCatalogProducts({
        shop: body.shop,
        first: products.length || 12,
      });
      source = "shopify_admin";
    }
  } catch {
    source = "fallback";
  }

  const catalog = normalizeStorefrontProducts(products);

  return NextResponse.json({
    ok: true,
    surface: body.surface ?? "home",
    shop: body.shop ?? null,
    handle: body.handle ?? null,
    source,
    productCount: catalog.length,
    products: catalog.length ? catalog : demoStorefrontCatalog,
  });
}
