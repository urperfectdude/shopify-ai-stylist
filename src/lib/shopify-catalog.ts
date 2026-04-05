import { env } from "./env";
import { mapShopifyAdminProductNode, type StorefrontProductInput } from "./storefront-ai";

type CatalogFetchParams = {
  shop?: string | null;
  handle?: string | null;
  productIds?: string[] | null;
  first?: number;
};

function configuredShopDomain(input?: string | null): string {
  const raw = String(input || env.shopDomain || env.shopifyStoreUrl || "").trim();
  if (!raw) {
    throw new Error("Missing Shopify shop domain for catalog fetch");
  }

  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function configuredAccessToken(): string {
  if (!env.shopifyAdminAccessToken) {
    throw new Error("Missing SHOPIFY_ADMIN_ACCESS_TOKEN for catalog fetch");
  }

  return env.shopifyAdminAccessToken;
}

async function adminGraphql<T>(shop: string, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`https://${shop}/admin/api/${env.shopifyApiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": configuredAccessToken(),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shopify catalog query failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("Shopify catalog query returned no data");
  }

  return payload.data;
}

export async function fetchShopifyCatalogProducts(
  params: CatalogFetchParams,
): Promise<StorefrontProductInput[]> {
  const shop = configuredShopDomain(params.shop);
  const first = Math.max(1, Math.min(params.first ?? 12, 24));

  if (params.handle) {
    const data = await adminGraphql<{
      productByHandle?: {
        id: string;
        handle: string;
        title: string;
        vendor: string;
        productType: string;
        tags: string[];
        onlineStoreUrl?: string | null;
        featuredMedia?: {
          preview?: {
            image?: {
              url?: string | null;
            } | null;
          } | null;
        } | null;
        priceRangeV2?: {
          minVariantPrice?: {
            amount?: string | null;
          } | null;
        } | null;
        variants?: {
          nodes?: Array<{
            id: string;
            title: string;
            availableForSale?: boolean | null;
            price?: string | null;
          }>;
        } | null;
      } | null;
    }>(
      shop,
      `#graphql
        query ProductByHandle($handle: String!) {
          productByHandle(handle: $handle) {
            id
            handle
            title
            vendor
            productType
            tags
            onlineStoreUrl
            featuredMedia {
              preview {
                image {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
            variants(first: 10) {
              nodes {
                id
                title
                availableForSale
                price
              }
            }
          }
        }`,
      { handle: params.handle },
    );

    return data.productByHandle ? [mapShopifyAdminProductNode(data.productByHandle)] : [];
  }

  const queryParts = params.productIds?.length
    ? params.productIds.map((id) => `id:${String(id).replace(/"/g, "")}`).join(" OR ")
    : "status:active";

  const data = await adminGraphql<{
    products: {
      nodes: Array<{
        id: string;
        handle: string;
        title: string;
        vendor: string;
        productType: string;
        tags: string[];
        onlineStoreUrl?: string | null;
        featuredMedia?: {
          preview?: {
            image?: {
              url?: string | null;
            } | null;
          } | null;
        } | null;
        priceRangeV2?: {
          minVariantPrice?: {
            amount?: string | null;
          } | null;
        } | null;
        variants?: {
          nodes?: Array<{
            id: string;
            title: string;
            availableForSale?: boolean | null;
            price?: string | null;
          }>;
        } | null;
      }>;
    };
  }>(
    shop,
    `#graphql
      query CatalogProducts($first: Int!, $query: String!) {
        products(first: $first, query: $query, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            handle
            title
            vendor
            productType
            tags
            onlineStoreUrl
            featuredMedia {
              preview {
                image {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
            variants(first: 10) {
              nodes {
                id
                title
                availableForSale
                price
              }
            }
          }
        }
      }`,
    {
      first,
      query: queryParts,
    },
  );

  return data.products.nodes.map(mapShopifyAdminProductNode);
}
