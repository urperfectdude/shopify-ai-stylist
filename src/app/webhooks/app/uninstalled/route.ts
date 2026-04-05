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

  await updateMerchantInstall(shop, {
    is_active: false,
    billing_status: "cancelled",
    access_token: "",
  });

  return NextResponse.json({ ok: true });
}
