import { NextResponse } from "next/server";
import { authenticateWebhook } from "@/lib/webhooks";

export async function POST(request: Request) {
  const webhook = await authenticateWebhook(request);

  if (!webhook.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: "Shop redact request acknowledged",
  });
}
