import { NextResponse } from "next/server";
import { sanitizeShopDomain } from "@/lib/shopify";
import { updateMerchantInstall } from "@/lib/supabase-admin";
import { authenticateWebhook } from "@/lib/webhooks";

export async function POST(request: Request) {
  const webhook = await authenticateWebhook(request);

  if (!webhook.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const shop = sanitizeShopDomain(webhook.shop);
  if (!shop) {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(webhook.rawBody) as {
    current?: Array<string>;
    updated_at?: string;
  };

  await updateMerchantInstall(shop, {
    scopes: payload.current?.join(",") ?? "",
  });

  return NextResponse.json({ ok: true });
}
