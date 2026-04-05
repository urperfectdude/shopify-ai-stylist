"use client";

import { useState } from "react";

type TryOnResponse = {
  ok: boolean;
  generatedImageUrl?: string;
  product?: {
    title?: string;
    handle?: string;
  };
  persisted?: boolean;
  persistenceError?: string | null;
  error?: string;
};

export function TryOnDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [status, setStatus] = useState("Upload a selfie to test the PDP try-on flow.");

  async function handleSubmit() {
    if (!file) {
      setStatus("Choose a selfie first.");
      return;
    }

    setStatus("Generating try-on preview...");
    const formData = new FormData();
    formData.append("shop", "q4iigp-af.myshopify.com");
    formData.append("handle", "minimal-tee");
    formData.append("guestToken", `demo_${Date.now()}`);
    formData.append("selfie", file);

    const response = await fetch("/api/storefront/try-on", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as TryOnResponse;
    setResult(payload);
    setStatus(
      response.ok
        ? `Generated try-on for ${payload.product?.title ?? "selected product"}`
        : payload.error ?? "Try-on failed",
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <span className="w-fit rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-sm text-violet-200">
            PDP try-on demo
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Upload a shopper selfie and preview the selected product
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-300">
            This demo hits the same guest try-on API as the product page theme block.
            It uses the current shop product handle and returns a generated preview image.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <input
            accept="image/*"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950"
              onClick={handleSubmit}
            >
              Try on me
            </button>
          </div>
          <p className="mt-4 text-sm text-neutral-300">{status}</p>
        </section>

        {result?.generatedImageUrl ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-medium">Generated result</h2>
            <img
              alt="Generated try-on preview"
              className="mt-4 w-full rounded-2xl border border-white/10"
              src={result.generatedImageUrl}
            />
            <p className="mt-4 text-sm text-neutral-300">
              Persisted to Supabase: {result.persisted ? "yes" : "no"}
            </p>
            {result.persistenceError ? (
              <p className="mt-2 text-sm text-amber-200">{result.persistenceError}</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
