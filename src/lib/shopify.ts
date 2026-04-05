import "@shopify/shopify-api/adapters/web-api";
import { ApiVersion, LogSeverity, shopifyApi } from "@shopify/shopify-api";
import { env } from "./env";

const versionMap: Record<string, ApiVersion> = {
  "2024-10": ApiVersion.October24,
  "2025-01": ApiVersion.January25,
  "2025-04": ApiVersion.April25,
  "2025-07": ApiVersion.July25,
  "2025-10": ApiVersion.October25,
  "2026-01": ApiVersion.January26,
  "2026-04": ApiVersion.April26,
};

export const shopify = shopifyApi({
  apiKey: env.shopifyApiKey,
  apiSecretKey: env.shopifyApiSecret,
  scopes: env.shopifyScopes.split(",").map((scope) => scope.trim()).filter(Boolean),
  hostName: new URL(env.shopifyAppUrl).host,
  hostScheme: "https",
  isEmbeddedApp: true,
  apiVersion: versionMap[env.shopifyApiVersion] ?? ApiVersion.April26,
  logger: {
    level: LogSeverity.Info,
  },
});

export function sanitizeShopDomain(shop: string | null | undefined): string | null {
  const value = String(shop ?? "").trim().toLowerCase();
  if (!value) {
    return null;
  }

  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value) ? value : null;
}
