import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-session";
import { env } from "@/lib/env";

export async function GET() {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/auth", env.shopifyAppUrl));
}
