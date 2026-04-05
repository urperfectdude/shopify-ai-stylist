function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  shopifyApiKey: required("SHOPIFY_API_KEY"),
  shopifyApiSecret: required("SHOPIFY_API_SECRET"),
  shopifyAppUrl: required("SHOPIFY_APP_URL"),
  shopifyScopes: process.env.SCOPES?.trim() || "read_products",
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION?.trim() || "2026-04",
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN?.trim() || "",
  shopifyAdminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() || "",
  shopifyStoreUrl: process.env.SHOPIFY_STORE_URL?.trim() || "",
} as const;
