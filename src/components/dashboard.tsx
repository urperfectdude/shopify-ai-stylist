"use client";

import { useMemo, useState } from "react";
import {
  buildGuestCartIntent,
  emptyGuestStyleProfile,
  loadGuestSession,
  saveGuestCartIntent,
  saveGuestProfile,
  type GuestSessionSnapshot,
} from "@/lib/guest-session";

const sampleMerchandiseIds = [
  "gid://shopify/ProductVariant/placeholder-top",
  "gid://shopify/ProductVariant/placeholder-bottom",
  "gid://shopify/ProductVariant/placeholder-shoe",
];

const stackItems = [
  {
    title: "App framework",
    value: "Next.js",
    description: "Will handle embedded admin UI, auth routes, billing, and Shopify-facing server endpoints.",
  },
  {
    title: "Backend data layer",
    value: "Supabase",
    description: "Will handle Postgres, storage, edge functions, and AI-oriented persistence.",
  },
  {
    title: "Development tunnel",
    value: "Cloudflare Tunnel",
    description: "Will provide the public HTTPS URL for local Shopify development.",
  },
  {
    title: "Shopper model",
    value: "Guest-first",
    description: "Profiles and cart intent work before any customer-account integration is added.",
  },
];

export function Dashboard() {
  const [snapshot, setSnapshot] = useState<GuestSessionSnapshot | null>(null);

  const seededProfile = useMemo(
    () => ({
      ...emptyGuestStyleProfile,
      displayName: "Guest shopper",
      fitPreference: "relaxed",
      preferredStyles: ["minimal", "smart casual"],
      preferredColors: ["black", "cream"],
      budget: { min: 40, max: 160 },
      occasion: "Weekend outing",
      mood: "Relaxed",
    }),
    [],
  );

  const handleLoadSession = () => {
    setSnapshot(loadGuestSession());
  };

  const handleSeedProfile = () => {
    const next = saveGuestProfile(seededProfile);
    setSnapshot(next);
  };

  const handleSeedCart = () => {
    const next = saveGuestCartIntent(
      buildGuestCartIntent(sampleMerchandiseIds, "seed-product-demo"),
    );
    setSnapshot(next);
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
              AI Stylist
            </span>
            <h1 className="text-4xl font-semibold tracking-tight">
              Next.js pivot with guest-first shopper state
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-300">
              This dashboard marks the architecture shift away from Remix. The app
              server will move to Next.js, Supabase remains the backend data layer,
              and Cloudflare Tunnel will be used for development URLs with Shopify.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stackItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {item.title}
              </p>
              <h2 className="mt-3 text-xl font-medium text-white">{item.value}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-300">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-medium">Auth model</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            Merchants authenticate through Shopify admin so billing and tenant
            ownership can be managed securely. Storefront shoppers remain guest
            users with local profile and cart intent state only.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
              href="/auth"
            >
              Test merchant auth
            </a>
            <a
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
              href="/app"
            >
              Open protected merchant area
            </a>
            <a
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
              href="/storefront-demo"
            >
              Open storefront demo
            </a>
            <a
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
              href="/try-on-demo"
            >
              Open try-on demo
            </a>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Guest-first test panel</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              Use this to validate the browser-only shopper model before wiring in
              Shopify customer accounts, Supabase sync, or storefront blocks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
                onClick={handleLoadSession}
              >
                Load guest session
              </button>
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                onClick={handleSeedProfile}
              >
                Seed guest profile
              </button>
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                onClick={handleSeedCart}
              >
                Seed cart intent
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              {snapshot ? (
                <div className="space-y-3 text-sm text-neutral-200">
                  <p>
                    <span className="text-neutral-400">Guest token:</span>{" "}
                    {snapshot.guestToken || "missing"}
                  </p>
                  <p>
                    <span className="text-neutral-400">Display name:</span>{" "}
                    {snapshot.profile.displayName || "not saved yet"}
                  </p>
                  <p>
                    <span className="text-neutral-400">Preferred styles:</span>{" "}
                    {snapshot.profile.preferredStyles.join(", ") || "not saved yet"}
                  </p>
                  <p>
                    <span className="text-neutral-400">Cart intent lines:</span>{" "}
                    {snapshot.cartIntent?.lines.length ?? 0}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No snapshot loaded yet. Click &quot;Load guest session&quot; to create the
                  browser-stored shopper identity.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Next implementation steps</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-300">
              <li>Wire live Shopify product ingestion into the storefront APIs.</li>
              <li>Connect theme app extension blocks to the public app URL in Shopify.</li>
              <li>Replace demo heuristics with Supabase and model-backed outfit generation.</li>
              <li>Add cart AJAX integration for add-on acceptance on storefront pages.</li>
              <li>Port remaining merchant settings and catalog sync tools into Next.js pages.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
