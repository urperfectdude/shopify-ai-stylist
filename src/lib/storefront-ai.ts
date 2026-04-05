import type { GuestStyleProfile } from "./guest-session";

export type StorefrontSurface = "home" | "collection" | "product";

export type StorefrontProductInput = {
  id?: string | number | null;
  handle?: string | null;
  title?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | string | null;
  featuredImage?: string | null;
  price?: number | string | null;
  url?: string | null;
  variants?: Array<{
    id?: string | number | null;
    title?: string | null;
    price?: number | string | null;
    available?: boolean | null;
  }> | null;
};

type StorefrontProductVariantInput = NonNullable<StorefrontProductInput["variants"]>[number];

type ShopifyAdminProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  onlineStoreUrl?: string | null;
  featuredMedia?: {
    preview?: {
      image?: {
        url?: string | null;
      } | null;
    } | null;
  } | null;
  priceRangeV2?: {
    minVariantPrice?: {
      amount?: string | null;
    } | null;
  } | null;
  variants?: {
    nodes?: Array<{
      id: string;
      title: string;
      availableForSale?: boolean | null;
      price?: string | null;
    }>;
  } | null;
};

export type StorefrontVariant = {
  id: string;
  title: string;
  price: number;
  available: boolean;
};

export type StorefrontCategory =
  | "top"
  | "bottom"
  | "outerwear"
  | "shoes"
  | "dress"
  | "accessory"
  | "unknown";

export type StorefrontProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: string | null;
  price: number;
  url: string | null;
  category: StorefrontCategory;
  variants: StorefrontVariant[];
};

export type OutfitResult = {
  seed: StorefrontProduct | null;
  outfit: StorefrontProduct[];
  addOns: StorefrontProduct[];
  cartLines: Array<{
    merchandiseId: string;
    quantity: number;
  }>;
  stylistCopy: string;
};

const categoryKeywords: Record<StorefrontCategory, string[]> = {
  top: ["shirt", "tee", "t-shirt", "top", "blouse", "sweater", "hoodie", "polo"],
  bottom: ["pant", "trouser", "jean", "short", "skirt", "legging", "denim"],
  outerwear: ["jacket", "coat", "blazer", "cardigan", "overshirt"],
  shoes: ["shoe", "sneaker", "boot", "sandal", "loafer", "heel"],
  dress: ["dress", "jumpsuit", "romper", "kurta", "gown"],
  accessory: ["bag", "belt", "cap", "hat", "scarf", "jewelry", "watch"],
  unknown: [],
};

const complementMap: Record<StorefrontCategory, StorefrontCategory[]> = {
  top: ["bottom", "shoes", "accessory"],
  bottom: ["top", "shoes", "outerwear"],
  outerwear: ["top", "bottom", "shoes"],
  shoes: ["top", "bottom", "accessory"],
  dress: ["shoes", "outerwear", "accessory"],
  accessory: ["top", "bottom", "shoes"],
  unknown: ["top", "bottom", "shoes"],
};

const demoCatalogInputs: StorefrontProductInput[] = [
  {
    id: "demo-tee-001",
    handle: "minimal-tee",
    title: "Minimal Black Tee",
    vendor: "AI Stylist Studio",
    productType: "T-Shirt",
    tags: ["minimal", "casual", "black", "top"],
    featuredImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    price: 48,
    url: "/products/minimal-tee",
    variants: [{ id: "demo-tee-001-s", title: "Small", price: 48, available: true }],
  },
  {
    id: "demo-jean-001",
    handle: "relaxed-denim",
    title: "Relaxed Indigo Denim",
    vendor: "AI Stylist Studio",
    productType: "Jeans",
    tags: ["denim", "weekend", "bottom", "blue"],
    featuredImage: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
    price: 92,
    url: "/products/relaxed-denim",
    variants: [{ id: "demo-jean-001-32", title: "32", price: 92, available: true }],
  },
  {
    id: "demo-sneaker-001",
    handle: "city-sneaker",
    title: "City White Sneaker",
    vendor: "AI Stylist Studio",
    productType: "Sneakers",
    tags: ["shoe", "minimal", "white"],
    featuredImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    price: 110,
    url: "/products/city-sneaker",
    variants: [{ id: "demo-sneaker-001-9", title: "US 9", price: 110, available: true }],
  },
  {
    id: "demo-jacket-001",
    handle: "smart-blazer",
    title: "Soft Tailored Blazer",
    vendor: "AI Stylist Studio",
    productType: "Blazer",
    tags: ["smart casual", "outerwear", "cream"],
    featuredImage: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80",
    price: 146,
    url: "/products/smart-blazer",
    variants: [{ id: "demo-jacket-001-m", title: "Medium", price: 146, available: true }],
  },
  {
    id: "demo-bag-001",
    handle: "structured-bag",
    title: "Structured Leather Crossbody",
    vendor: "AI Stylist Studio",
    productType: "Bag",
    tags: ["accessory", "smart casual", "brown"],
    featuredImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
    price: 84,
    url: "/products/structured-bag",
    variants: [{ id: "demo-bag-001-default", title: "Default", price: 84, available: true }],
  },
  {
    id: "demo-dress-001",
    handle: "satin-midi",
    title: "Satin Midi Dress",
    vendor: "AI Stylist Studio",
    productType: "Dress",
    tags: ["dress", "evening", "black"],
    featuredImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    price: 128,
    url: "/products/satin-midi",
    variants: [{ id: "demo-dress-001-m", title: "Medium", price: 128, available: true }],
  },
];

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTags(tags: StorefrontProductInput["tags"]): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }

  return String(tags ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function inferCategory(product: StorefrontProductInput): StorefrontCategory {
  const haystack = [
    product.title,
    product.productType,
    ...(Array.isArray(product.tags) ? product.tags : [product.tags]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords) as Array<
    [StorefrontCategory, string[]]
  >) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return "unknown";
}

function normalizeVariant(
  variant: StorefrontProductVariantInput | null | undefined,
  index: number,
  productId: string,
  fallbackPrice: number,
): StorefrontVariant {
  return {
    id: String(variant?.id ?? `${productId}-variant-${index + 1}`),
    title: String(variant?.title ?? `Variant ${index + 1}`),
    price: toNumber(variant?.price ?? fallbackPrice),
    available: variant?.available !== false,
  };
}

export function normalizeStorefrontProducts(
  products: StorefrontProductInput[] | null | undefined,
): StorefrontProduct[] {
  const entries = (products?.length ? products : demoCatalogInputs).filter(Boolean);

  return entries.map((product, index) => {
    const id = String(product.id ?? product.handle ?? `product-${index + 1}`);
    const title = String(product.title ?? `Product ${index + 1}`);
    const price = toNumber(product.price);

    return {
      id,
      handle: String(product.handle ?? id),
      title,
      vendor: String(product.vendor ?? "Unknown vendor"),
      productType: String(product.productType ?? "Uncategorized"),
      tags: normalizeTags(product.tags),
      featuredImage: product.featuredImage ? String(product.featuredImage) : null,
      price,
      url: product.url ? String(product.url) : null,
      category: inferCategory(product),
      variants:
        product.variants?.length
          ? product.variants.map((variant, variantIndex) =>
              normalizeVariant(variant, variantIndex, id, price),
            )
          : [
              {
                id,
                title: "Default",
                price,
                available: true,
              },
            ],
    };
  });
}

function scoreProduct(product: StorefrontProduct, profile: Partial<GuestStyleProfile>): number {
  let score = 0;
  const tagsText = `${product.title} ${product.productType} ${product.tags.join(" ")}`.toLowerCase();

  if (profile.preferredStyles?.length) {
    score += profile.preferredStyles.reduce(
      (sum, style) => sum + (tagsText.includes(style.toLowerCase()) ? 8 : 0),
      0,
    );
  }

  if (profile.preferredColors?.length) {
    score += profile.preferredColors.reduce(
      (sum, color) => sum + (tagsText.includes(color.toLowerCase()) ? 6 : 0),
      0,
    );
  }

  if (profile.occasion && tagsText.includes(profile.occasion.toLowerCase())) {
    score += 5;
  }

  if (profile.mood && tagsText.includes(profile.mood.toLowerCase())) {
    score += 4;
  }

  if (profile.fitPreference && tagsText.includes(profile.fitPreference.toLowerCase())) {
    score += 4;
  }

  if (profile.budget?.max && product.price <= profile.budget.max) {
    score += 3;
  }

  if (profile.budget?.min && product.price >= profile.budget.min) {
    score += 2;
  }

  return score;
}

function uniqueProducts(products: StorefrontProduct[]): StorefrontProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }

    seen.add(product.id);
    return true;
  });
}

function buildStylistCopy(params: {
  surface: StorefrontSurface;
  seed: StorefrontProduct | null;
  profile: Partial<GuestStyleProfile>;
  outfit: StorefrontProduct[];
}): string {
  const mood = params.profile.mood || "effortless";
  const occasion = params.profile.occasion || "everyday wear";
  const lead = params.seed ? `Starting with ${params.seed.title}, ` : "";
  const supporting = params.outfit
    .slice(1)
    .map((product) => product.title)
    .join(", ");

  return `${lead}this ${params.surface} recommendation leans ${mood.toLowerCase()} for ${occasion.toLowerCase()}. ${
    supporting ? `Pair it with ${supporting} to complete the look.` : "Build around the current catalog highlights."
  }`;
}

export function buildOutfitResult(params: {
  surface: StorefrontSurface;
  products: StorefrontProductInput[] | null | undefined;
  seedProductId?: string | null;
  profile?: Partial<GuestStyleProfile>;
}): OutfitResult {
  const normalizedProducts = normalizeStorefrontProducts(params.products);
  const profile = params.profile ?? {};
  const seed =
    normalizedProducts.find((product) => product.id === params.seedProductId) ??
    normalizedProducts[0] ??
    null;

  const candidates = normalizedProducts.filter((product) => product.id !== seed?.id);
  const desiredCategories = complementMap[seed?.category ?? "unknown"];
  const chosen: StorefrontProduct[] = seed ? [seed] : [];

  for (const category of desiredCategories) {
    const next = uniqueProducts(candidates)
      .filter((product) => product.category === category)
      .sort((left, right) => scoreProduct(right, profile) - scoreProduct(left, profile))[0];

    if (next && !chosen.some((product) => product.id === next.id)) {
      chosen.push(next);
    }
  }

  if (chosen.length < 3) {
    const fallbacks = uniqueProducts(candidates)
      .sort((left, right) => scoreProduct(right, profile) - scoreProduct(left, profile))
      .slice(0, 3 - chosen.length);
    chosen.push(...fallbacks.filter((product) => !chosen.some((item) => item.id === product.id)));
  }

  const remainingProducts = uniqueProducts(candidates)
    .filter((product) => !chosen.some((item) => item.id === product.id))
    .sort((left, right) => scoreProduct(right, profile) - scoreProduct(left, profile));

  const addOns = remainingProducts
    .filter((product) => ["accessory", "outerwear", "shoes"].includes(product.category))
    .slice(0, 3);

  const cartLines = chosen.map((product) => ({
    merchandiseId: product.variants.find((variant) => variant.available)?.id ?? product.id,
    quantity: 1,
  }));

  return {
    seed,
    outfit: uniqueProducts(chosen).slice(0, 4),
    addOns,
    cartLines,
    stylistCopy: buildStylistCopy({
      surface: params.surface,
      seed,
      profile,
      outfit: chosen,
    }),
  };
}

export function buildAddOnRecommendations(params: {
  products: StorefrontProductInput[] | null | undefined;
  selectedProductIds?: string[] | null;
  profile?: Partial<GuestStyleProfile>;
}): StorefrontProduct[] {
  const normalizedProducts = normalizeStorefrontProducts(params.products);
  const selectedIds = new Set((params.selectedProductIds ?? []).map(String));

  return normalizedProducts
    .filter((product) => !selectedIds.has(product.id))
    .sort((left, right) => scoreProduct(right, params.profile ?? {}) - scoreProduct(left, params.profile ?? {}))
    .slice(0, 4);
}

export function buildCartIntentPreview(params: {
  products: StorefrontProductInput[] | null | undefined;
  selectedProductIds?: string[] | null;
}): Array<{ merchandiseId: string; quantity: number }> {
  const normalizedProducts = normalizeStorefrontProducts(params.products);
  const selectedIds = new Set((params.selectedProductIds ?? []).map(String));

  return normalizedProducts
    .filter((product) => selectedIds.has(product.id))
    .map((product) => ({
      merchandiseId: product.variants.find((variant) => variant.available)?.id ?? product.id,
      quantity: 1,
    }));
}

export const demoStorefrontCatalog = normalizeStorefrontProducts(demoCatalogInputs);

export function mapShopifyAdminProductNode(node: ShopifyAdminProductNode): StorefrontProductInput {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags,
    featuredImage: node.featuredMedia?.preview?.image?.url ?? null,
    price: node.priceRangeV2?.minVariantPrice?.amount ?? null,
    url: node.onlineStoreUrl ?? null,
    variants:
      node.variants?.nodes?.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price ?? null,
        available: variant.availableForSale ?? true,
      })) ?? [],
  };
}
