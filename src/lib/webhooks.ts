import { headers } from "next/headers";
import { shopify } from "./shopify";

export async function authenticateWebhook(request: Request) {
  const headerStore = await headers();
  const rawBody = await request.text();

  const valid = await shopify.webhooks.validate({
    rawBody,
    rawRequest: request,
    rawResponse: new Response(),
  });

  if (!valid.valid) {
    return {
      ok: false as const,
      rawBody,
      topic: headerStore.get("x-shopify-topic"),
      shop: headerStore.get("x-shopify-shop-domain"),
    };
  }

  return {
    ok: true as const,
    rawBody,
    topic: headerStore.get("x-shopify-topic"),
    shop: headerStore.get("x-shopify-shop-domain"),
  };
}
