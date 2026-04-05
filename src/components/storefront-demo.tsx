"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildGuestCartIntent,
  emptyGuestStyleProfile,
  loadGuestSession,
  saveGuestCartIntent,
  saveGuestProfile,
  type GuestStyleProfile,
} from "@/lib/guest-session";
import type { OutfitResult, StorefrontProduct } from "@/lib/storefront-ai";

type ContextResponse = {
  products: StorefrontProduct[];
};

type AddOnResponse = {
  addOns: StorefrontProduct[];
  cartLines: Array<{ merchandiseId: string; quantity: number }>;
};

const surfaceOptions = [
  { id: "home", label: "Home" },
  { id: "collection", label: "Collection" },
  { id: "product", label: "Product detail" },
] as const;

export function StorefrontDemo() {
  const [surface, setSurface] = useState<(typeof surfaceOptions)[number]["id"]>("product");
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [seedProductId, setSeedProductId] = useState<string>("");
  const [profile, setProfile] = useState<GuestStyleProfile>({
    ...emptyGuestStyleProfile,
    preferredStyles: ["minimal", "smart casual"],
    preferredColors: ["black", "cream"],
    fitPreference: "relaxed",
    occasion: "Weekend outing",
    mood: "Relaxed",
    budget: { min: 40, max: 160 },
  });
  const [outfitResult, setOutfitResult] = useState<OutfitResult | null>(null);
  const [addOns, setAddOns] = useState<StorefrontProduct[]>([]);
  const [status, setStatus] = useState<string>("Loading demo catalog...");

  useEffect(() => {
    async function loadCatalog() {
      const guestSession = loadGuestSession();
      if (guestSession.profile.updatedAt) {
        setProfile(guestSession.profile);
      }

      const response = await fetch("/api/storefront/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface }),
      });
      const payload = (await response.json()) as ContextResponse;
      setProducts(payload.products);
      setSeedProductId(payload.products[0]?.id ?? "");
      setStatus("Demo catalog loaded");
    }

    void loadCatalog();
  }, [surface]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === seedProductId) ?? products[0] ?? null,
    [products, seedProductId],
  );

  async function generateOutfit() {
    setStatus("Generating guest outfit...");
    saveGuestProfile(profile);

    const response = await fetch("/api/storefront/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        surface,
        seedProductId: selectedProduct?.id ?? null,
        profile,
        products,
      }),
    });
    const payload = (await response.json()) as OutfitResult & {
      generatedAt: string;
    };

    setOutfitResult(payload);
    setStatus(`Outfit generated at ${new Date(payload.generatedAt).toLocaleTimeString()}`);
  }

  async function loadAddOns() {
    const selectedIds = outfitResult?.outfit.map((product) => product.id) ?? [];
    const response = await fetch("/api/storefront/add-ons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedProductIds: selectedIds,
        profile,
        products,
      }),
    });
    const payload = (await response.json()) as AddOnResponse;
    setAddOns(payload.addOns);
    setStatus("Add-on recommendations loaded");
  }

  function saveCartIntent() {
    const merchandiseIds =
      outfitResult?.cartLines.map((line) => line.merchandiseId) ??
      selectedProduct?.variants.map((variant) => variant.id) ??
      [];

    const snapshot = saveGuestCartIntent(
      buildGuestCartIntent(merchandiseIds, selectedProduct?.id ?? null),
    );
    setStatus(`Guest cart intent saved with ${snapshot.cartIntent?.lines.length ?? 0} lines`);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <span className="w-fit rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-sm text-violet-200">
            Storefront AI demo
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Shopper-facing home, collection, PDP, and cart recommendation slice
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-300">
            This page simulates the theme app extension experience before the blocks
            are installed into a live theme. It exercises guest outfit generation,
            product-context ingestion, and add-on/cart flows using the same APIs the
            storefront blocks will call.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Scenario</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {surfaceOptions.map((option) => (
                <button
                  key={option.id}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    surface === option.id
                      ? "bg-cyan-400 text-neutral-950"
                      : "border border-white/15 text-white"
                  }`}
                  onClick={() => setSurface(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="mt-6 block text-sm text-neutral-300">
              Seed product
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                value={seedProductId}
                onChange={(event) => setSeedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-neutral-300">
                Mood
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                  value={profile.mood}
                  onChange={(event) => setProfile((current) => ({ ...current, mood: event.target.value }))}
                />
              </label>
              <label className="text-sm text-neutral-300">
                Occasion
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                  value={profile.occasion}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, occasion: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
                onClick={generateOutfit}
              >
                Generate outfit
              </button>
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                onClick={loadAddOns}
              >
                Load add-ons
              </button>
              <button
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                onClick={saveCartIntent}
              >
                Save guest cart intent
              </button>
            </div>

            <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300">
              {status}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Catalog context</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`rounded-2xl border p-4 ${
                    product.id === selectedProduct?.id
                      ? "border-cyan-400/50 bg-cyan-400/10"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{product.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">{product.productType}</p>
                  <p className="mt-2 text-sm text-neutral-300">${product.price}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Generated outfit</h2>
            {outfitResult ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm leading-6 text-neutral-300">{outfitResult.stylistCopy}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {outfitResult.outfit.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-medium text-white">{product.title}</p>
                      <p className="mt-1 text-sm text-neutral-400">{product.category}</p>
                      <p className="mt-2 text-sm text-neutral-300">
                        Variant: {product.variants[0]?.title ?? "Default"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-400">
                Generate an outfit to preview the guest recommendation response.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Add-on recommendations</h2>
            {addOns.length ? (
              <div className="mt-4 space-y-3">
                {addOns.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">{product.title}</p>
                    <p className="mt-1 text-sm text-neutral-400">{product.productType}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-400">
                Load add-ons after generating an outfit to see cart expansion ideas.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
