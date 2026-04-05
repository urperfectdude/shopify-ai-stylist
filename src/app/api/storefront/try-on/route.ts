import { NextResponse } from "next/server";
import { fetchShopifyCatalogProducts } from "@/lib/shopify-catalog";
import {
  createStorefrontTryOnJob,
  getPublicStorageUrl,
  uploadStorageObject,
} from "@/lib/supabase-admin";
import { generateTryOnImage } from "@/lib/try-on";

export async function POST(request: Request) {
  const formData = await request.formData();
  const shop = String(formData.get("shop") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();
  const guestToken = String(formData.get("guestToken") ?? "").trim() || null;
  const selfie = formData.get("selfie");

  if (!shop || !handle) {
    return NextResponse.json(
      { ok: false, error: "Missing shop or product handle" },
      { status: 400 },
    );
  }

  if (!(selfie instanceof File) || selfie.size === 0) {
    return NextResponse.json(
      { ok: false, error: "Upload a selfie to generate the try-on result" },
      { status: 400 },
    );
  }

  const products = await fetchShopifyCatalogProducts({
    shop,
    handle,
    first: 1,
  });

  const product = products[0];
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Product not found for try-on" },
      { status: 404 },
    );
  }

  const buffer = Buffer.from(await selfie.arrayBuffer());
  const selfieDataUrl = `data:${selfie.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
  const timestamp = Date.now();
  const normalizedShop = shop.replace(/[^a-z0-9.-]/gi, "-");
  const normalizedHandle = handle.replace(/[^a-z0-9-]/gi, "-");
  const selfieExtension = selfie.type === "image/png" ? "png" : selfie.type === "image/webp" ? "webp" : "jpg";
  const selfieStoragePath = `${normalizedShop}/${normalizedHandle}/${timestamp}-selfie.${selfieExtension}`;

  const selfieUpload = await uploadStorageObject({
    bucket: "try-on-inputs",
    path: selfieStoragePath,
    body: buffer,
    contentType: selfie.type || "image/jpeg",
    upsert: true,
  });

  const generated = await generateTryOnImage({
    selfieBase64: buffer.toString("base64"),
    selfieMimeType: selfie.type || "image/jpeg",
    selfieDataUrl,
    productImageUrl: product.featuredImage ?? null,
    productTitle: product.title ?? "Selected product",
  });
  const generatedBase64 = generated.dataUrl.split(",")[1] ?? "";
  const generatedBuffer = Buffer.from(
    generated.mimeType === "image/svg+xml" ? decodeURIComponent(generatedBase64) : generatedBase64,
    generated.mimeType === "image/svg+xml" ? "utf8" : "base64",
  );
  const resultExtension = generated.mimeType === "image/svg+xml" ? "svg" : "png";
  const generatedStoragePath = `${normalizedShop}/${normalizedHandle}/${timestamp}-result.${resultExtension}`;

  const generatedUpload = await uploadStorageObject({
    bucket: "try-on-results",
    path: generatedStoragePath,
    body: generatedBuffer,
    contentType: generated.mimeType,
    upsert: true,
  });
  const generatedImageUrl =
    generatedUpload.path && getPublicStorageUrl("try-on-results", generatedUpload.path);

  const jobResult = await createStorefrontTryOnJob({
    shopDomain: shop,
    productHandle: handle,
    productTitle: product.title ?? null,
    guestToken,
    uploadedFilename: selfie.name || null,
    uploadedContentType: selfie.type || null,
    selfieStoragePath: selfieUpload.path,
    generatedStoragePath: generatedUpload.path,
    generatedImageUrl: generatedImageUrl ?? generated.dataUrl,
    status: "completed",
  });

  return NextResponse.json({
    ok: true,
    jobId: jobResult.data?.id ?? null,
    source: generated.source,
    product,
    generatedImageUrl: generatedImageUrl ?? generated.dataUrl,
    selfieStored: Boolean(selfieUpload.path),
    resultStored: Boolean(generatedUpload.path),
    persisted: !jobResult.error,
    persistenceError: jobResult.error || selfieUpload.error || generatedUpload.error,
  });
}
