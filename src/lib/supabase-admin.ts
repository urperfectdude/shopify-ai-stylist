type QueryResult<T> = {
  data: T | null;
  error: string | null;
};

export type MerchantInstall = {
  shop_domain: string;
  tenant_id: string;
  shop_name: string | null;
  access_token: string;
  scopes: string;
  is_active: boolean;
  billing_status: string;
  billing_plan_name: string | null;
  billing_interval: string | null;
  billing_amount: number | null;
  billing_currency: string | null;
  billing_discount_code: string | null;
  billing_discount_type: string | null;
  billing_discount_value: number | null;
  billing_confirmation_url: string | null;
  billing_subscription_id: string | null;
  billing_activated_at: string | null;
  coupon_redeemed_at: string | null;
  installed_at: string;
  updated_at: string;
};

export type BillingCoupon = {
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  duration_in_intervals: number | null;
  max_redemptions: number | null;
  redeem_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingRedemption = {
  id: string;
  code: string;
  shop_domain: string;
  tenant_id: string;
  redeemed_at: string;
  status: "redeemed" | "applied" | "expired" | "revoked";
  applied_amount: number | null;
  created_at: string;
  updated_at: string;
};

export type StorefrontTryOnJob = {
  id: string;
  shop_domain: string;
  product_handle: string;
  product_title: string | null;
  guest_token: string | null;
  uploaded_filename: string | null;
  uploaded_content_type: string | null;
  selfie_storage_path: string | null;
  generated_storage_path: string | null;
  generated_image_url: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
};

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || null;
const projectUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim() ||
  (projectRef ? `https://${projectRef}.supabase.co` : null);

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;

function canUseSupabaseAdmin(): boolean {
  return Boolean(projectUrl && serviceRoleKey);
}

async function querySupabase<T>(
  path: string,
  init?: RequestInit,
): Promise<QueryResult<T>> {
  if (!canUseSupabaseAdmin()) {
    return {
      data: null,
      error: "Supabase admin environment variables are not configured",
    };
  }

  const response = await fetch(`${projectUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey!}`,
      Prefer: "return=representation,resolution=merge-duplicates",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    return {
      data: null,
      error: await response.text(),
    };
  }

  const payload = (await response.json()) as T;
  return {
    data: payload,
    error: null,
  };
}

export function tenantIdFromShop(shopDomain: string): string {
  return shopDomain.replace(/\.myshopify\.com$/, "").toLowerCase();
}

export async function upsertMerchantTenant(params: {
  shopDomain: string;
  shopName: string;
  accessToken: string;
  scopes: string;
}) {
  const tenantId = tenantIdFromShop(params.shopDomain);

  const tenantResult = await querySupabase<unknown[]>("tenants", {
    method: "POST",
    body: JSON.stringify({
      id: tenantId,
      name: params.shopName,
      contact_email: null,
      is_active: true,
    }),
  });

  if (tenantResult.error) {
    return {
      tenantId,
      error: tenantResult.error,
    };
  }

  const installResult = await querySupabase<unknown[]>("shopify_store_installs", {
    method: "POST",
    body: JSON.stringify({
      shop_domain: params.shopDomain,
      tenant_id: tenantId,
      shop_name: params.shopName,
      access_token: params.accessToken,
      scopes: params.scopes,
      is_active: true,
    }),
  });

  return {
    tenantId,
    error: installResult.error,
  };
}

export async function getMerchantInstall(shopDomain: string) {
  const result = await querySupabase<MerchantInstall[]>(
    `shopify_store_installs?shop_domain=eq.${encodeURIComponent(shopDomain)}&select=*`,
    { method: "GET" },
  );

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function updateMerchantInstall(
  shopDomain: string,
  values: Partial<MerchantInstall>,
) {
  const result = await querySupabase<MerchantInstall[]>(
    `shopify_store_installs?shop_domain=eq.${encodeURIComponent(shopDomain)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function getBillingCoupon(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const result = await querySupabase<BillingCoupon[]>(
    `app_billing_coupons?code=eq.${encodeURIComponent(normalizedCode)}&select=*`,
    { method: "GET" },
  );

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function getBillingRedemptionsForCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const result = await querySupabase<BillingRedemption[]>(
    `app_billing_redemptions?code=eq.${encodeURIComponent(normalizedCode)}&select=*`,
    { method: "GET" },
  );

  return {
    data: result.data ?? [],
    error: result.error,
  };
}

export async function getBillingRedemptionForShop(shopDomain: string) {
  const result = await querySupabase<BillingRedemption[]>(
    `app_billing_redemptions?shop_domain=eq.${encodeURIComponent(shopDomain)}&select=*`,
    { method: "GET" },
  );

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function redeemBillingCoupon(params: {
  code: string;
  shopDomain: string;
  tenantId: string;
}) {
  const normalizedCode = params.code.trim().toUpperCase();
  const couponResult = await getBillingCoupon(normalizedCode);

  if (couponResult.error) {
    return { data: null, error: couponResult.error };
  }

  if (!couponResult.data) {
    return { data: null, error: "Coupon not found" };
  }

  const coupon = couponResult.data;
  const now = Date.now();

  if (!coupon.is_active) {
    return { data: null, error: "Coupon is inactive" };
  }

  if (coupon.redeem_by && Date.parse(coupon.redeem_by) < now) {
    return { data: null, error: "Coupon has expired" };
  }

  const existingShopRedemption = await getBillingRedemptionForShop(params.shopDomain);
  if (existingShopRedemption.error) {
    return { data: null, error: existingShopRedemption.error };
  }

  if (existingShopRedemption.data) {
    return { data: existingShopRedemption.data, error: null };
  }

  const allRedemptions = await getBillingRedemptionsForCode(normalizedCode);
  if (allRedemptions.error) {
    return { data: null, error: allRedemptions.error };
  }

  if (
    coupon.max_redemptions !== null &&
    allRedemptions.data.filter((item) => item.status !== "revoked").length >=
      coupon.max_redemptions
  ) {
    return { data: null, error: "Coupon redemption limit reached" };
  }

  const insertResult = await querySupabase<BillingRedemption[]>("app_billing_redemptions", {
    method: "POST",
    body: JSON.stringify({
      code: normalizedCode,
      shop_domain: params.shopDomain,
      tenant_id: params.tenantId,
      status: "redeemed",
    }),
  });

  return {
    data: insertResult.data?.[0] ?? null,
    error: insertResult.error,
  };
}

export async function updateBillingRedemption(id: string, values: Partial<BillingRedemption>) {
  const result = await querySupabase<BillingRedemption[]>(
    `app_billing_redemptions?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function createStorefrontTryOnJob(params: {
  shopDomain: string;
  productHandle: string;
  productTitle?: string | null;
  guestToken?: string | null;
  uploadedFilename?: string | null;
  uploadedContentType?: string | null;
  selfieStoragePath?: string | null;
  generatedStoragePath?: string | null;
  generatedImageUrl?: string | null;
  status?: StorefrontTryOnJob["status"];
}) {
  const result = await querySupabase<StorefrontTryOnJob[]>("storefront_try_on_jobs", {
    method: "POST",
    body: JSON.stringify({
      shop_domain: params.shopDomain,
      product_handle: params.productHandle,
      product_title: params.productTitle ?? null,
      guest_token: params.guestToken ?? null,
      uploaded_filename: params.uploadedFilename ?? null,
      uploaded_content_type: params.uploadedContentType ?? null,
      selfie_storage_path: params.selfieStoragePath ?? null,
      generated_storage_path: params.generatedStoragePath ?? null,
      generated_image_url: params.generatedImageUrl ?? null,
      status: params.status ?? "completed",
    }),
  });

  return {
    data: result.data?.[0] ?? null,
    error: result.error,
  };
}

export async function uploadStorageObject(params: {
  bucket: string;
  path: string;
  body: BodyInit;
  contentType: string;
  upsert?: boolean;
}) {
  if (!projectUrl || !serviceRoleKey) {
    return {
      path: null,
      error: "Supabase admin environment variables are not configured",
    };
  }

  const response = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(params.bucket)}/${params.path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": params.contentType,
        "x-upsert": params.upsert ? "true" : "false",
      },
      body: params.body,
    },
  );

  if (!response.ok) {
    return {
      path: null,
      error: await response.text(),
    };
  }

  return {
    path: params.path,
    error: null,
  };
}

export function getPublicStorageUrl(bucket: string, path: string): string | null {
  if (!projectUrl) {
    return null;
  }

  return `${projectUrl}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export const supabaseAdminEnabled = canUseSupabaseAdmin();
