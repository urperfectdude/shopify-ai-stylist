import { env } from "./env";

type ShopifyAdminSnapshot = {
  shopName: string;
  myshopifyDomain: string;
  productCount: number;
  planName: string | null;
};

export type ShopifyAppSubscription = {
  id: string;
  name: string;
  status: string;
  test: boolean;
  amount: number | null;
  currencyCode: string | null;
  interval: string | null;
};

async function shopifyAdminRequest<T>(params: {
  shop: string;
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const endpoint = `https://${params.shop}/admin/api/${env.shopifyApiVersion}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": params.accessToken,
    },
    body: JSON.stringify({
      query: params.query,
      variables: params.variables,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Shopify admin query failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((item) => item.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("Shopify admin query returned no data");
  }

  return payload.data;
}

export async function getShopifyAdminSnapshot(params: {
  shop: string;
  accessToken: string;
}): Promise<ShopifyAdminSnapshot> {
  const payload = await shopifyAdminRequest<{
    shop?: {
      name?: string;
      myshopifyDomain?: string;
      plan?: { displayName?: string | null } | null;
    };
    productsCount?: {
      count?: number;
    };
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `#graphql
      query MerchantSnapshot {
        shop {
          name
          myshopifyDomain
          plan {
            displayName
          }
        }
        productsCount {
          count
        }
      }`,
  });

  return {
    shopName: payload.shop?.name ?? params.shop,
    myshopifyDomain: payload.shop?.myshopifyDomain ?? params.shop,
    productCount: payload.productsCount?.count ?? 0,
    planName: payload.shop?.plan?.displayName ?? null,
  };
}

export async function getActiveAppSubscription(params: {
  shop: string;
  accessToken: string;
}): Promise<ShopifyAppSubscription | null> {
  const payload = await shopifyAdminRequest<{
    currentAppInstallation?: {
      activeSubscriptions?: Array<{
        id?: string;
        name?: string;
        status?: string;
        test?: boolean;
        lineItems?: Array<{
          plan?: {
            pricingDetails?: {
              __typename?: string;
              interval?: string;
              price?: {
                amount?: string;
                currencyCode?: string;
              };
            } | null;
          } | null;
        }>;
      }>;
    } | null;
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `#graphql
      query ActiveAppSubscription {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            test
            lineItems {
              plan {
                pricingDetails {
                  __typename
                  ... on AppRecurringPricing {
                    interval
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }`,
  });

  const subscription = payload.currentAppInstallation?.activeSubscriptions?.[0];
  const pricing = subscription?.lineItems?.[0]?.plan?.pricingDetails;

  if (!subscription?.id) {
    return null;
  }

  return {
    id: subscription.id,
    name: subscription.name ?? "AI Stylist subscription",
    status: subscription.status ?? "UNKNOWN",
    test: Boolean(subscription.test),
    amount: pricing?.price?.amount ? Number(pricing.price.amount) : null,
    currencyCode: pricing?.price?.currencyCode ?? null,
    interval: pricing?.interval ?? null,
  };
}

export async function createAppSubscription(params: {
  shop: string;
  accessToken: string;
  planName: string;
  amount: number;
  currencyCode: string;
  interval: string;
  returnUrl: string;
  test: boolean;
}) {
  const payload = await shopifyAdminRequest<{
    appSubscriptionCreate?: {
      confirmationUrl?: string | null;
      appSubscription?: {
        id?: string | null;
        status?: string | null;
      } | null;
      userErrors?: Array<{
        field?: string[] | null;
        message?: string | null;
      }>;
    };
  }>({
    shop: params.shop,
    accessToken: params.accessToken,
    query: `#graphql
      mutation CreateAppSubscription(
        $name: String!
        $returnUrl: URL!
        $test: Boolean!
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          test: $test
          lineItems: $lineItems
        ) {
          confirmationUrl
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }`,
    variables: {
      name: params.planName,
      returnUrl: params.returnUrl,
      test: params.test,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: {
                amount: params.amount,
                currencyCode: params.currencyCode,
              },
              interval: params.interval,
            },
          },
        },
      ],
    },
  });

  const result = payload.appSubscriptionCreate;
  const errors =
    result?.userErrors?.map((item) => item.message).filter(Boolean as never) ?? [];

  if (!result || errors.length) {
    throw new Error(errors.join(", ") || "Unable to create Shopify subscription");
  }

  return {
    confirmationUrl: result.confirmationUrl ?? null,
    subscriptionId: result.appSubscription?.id ?? null,
    status: result.appSubscription?.status ?? null,
  };
}
