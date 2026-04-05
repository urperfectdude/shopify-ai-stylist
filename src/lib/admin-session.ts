import { cookies } from "next/headers";

export const ADMIN_SHOP_COOKIE = "ai_stylist_admin_shop";
export const ADMIN_TOKEN_COOKIE = "ai_stylist_admin_token";

export async function setAdminSession(shop: string, accessToken: string) {
  const store = await cookies();

  store.set(ADMIN_SHOP_COOKIE, shop, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  store.set(ADMIN_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_SHOP_COOKIE);
  store.delete(ADMIN_TOKEN_COOKIE);
}

export async function getAdminSession() {
  const store = await cookies();
  const shop = store.get(ADMIN_SHOP_COOKIE)?.value ?? null;
  const accessToken = store.get(ADMIN_TOKEN_COOKIE)?.value ?? null;

  if (!shop || !accessToken) {
    return null;
  }

  return { shop, accessToken };
}
