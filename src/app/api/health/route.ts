import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "AI Stylist",
    framework: "nextjs",
    backend: "supabase",
    tunnel: "cloudflare",
    timestamp: new Date().toISOString(),
  });
}
