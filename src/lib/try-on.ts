type TryOnGenerationParams = {
  selfieBase64: string;
  selfieMimeType: string;
  selfieDataUrl: string;
  productTitle: string;
  productImageUrl: string | null;
};

function buildFallbackTryOnUrl(params: {
  selfieDataUrl: string;
  productImageUrl: string | null;
  productTitle: string;
}) {
  const productImageMarkup = params.productImageUrl
    ? `<img src="${params.productImageUrl}" alt="${params.productTitle}" style="width:42%;height:100%;object-fit:cover;position:absolute;right:0;top:0;filter:saturate(1.05);" />`
    : `<div style="width:42%;height:100%;position:absolute;right:0;top:0;background:linear-gradient(180deg,#dbeafe,#ede9fe);display:flex;align-items:center;justify-content:center;color:#1e293b;font-size:22px;font-weight:700;padding:24px;text-align:center;">${params.productTitle}</div>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1280" viewBox="0 0 1024 1280">
      <foreignObject width="1024" height="1280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:1024px;height:1280px;background:#0f172a;font-family:Arial,sans-serif;overflow:hidden;">
          <img src="${params.selfieDataUrl}" alt="Uploaded selfie" style="position:absolute;left:0;top:0;width:68%;height:100%;object-fit:cover;" />
          <div style="position:absolute;left:0;top:0;width:68%;height:100%;background:linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.28));"></div>
          ${productImageMarkup}
          <div style="position:absolute;left:48px;bottom:48px;right:48px;background:rgba(15,23,42,0.74);border-radius:24px;padding:28px;color:white;">
            <div style="font-size:14px;letter-spacing:0.14em;text-transform:uppercase;color:#a5b4fc;">AI Stylist try on</div>
            <div style="font-size:38px;font-weight:700;line-height:1.15;margin-top:14px;">${params.productTitle}</div>
            <div style="font-size:18px;line-height:1.6;margin-top:12px;color:#e2e8f0;">
              Preview generated from the shopper selfie and the selected Shopify product.
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateTryOnImage(params: TryOnGenerationParams) {
  const edgeFunctionUrl = process.env.SUPABASE_TRY_ON_FUNCTION_URL?.trim() || "";
  const functionBearer = process.env.SUPABASE_TRY_ON_FUNCTION_BEARER?.trim() || "";

  if (edgeFunctionUrl) {
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(functionBearer ? { Authorization: `Bearer ${functionBearer}` } : {}),
        },
        body: JSON.stringify({
          selfieBase64: params.selfieBase64,
          selfieMimeType: params.selfieMimeType,
          productImageUrl: params.productImageUrl,
          productTitle: params.productTitle,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          imageBase64?: string;
          mimeType?: string;
        };

        if (payload.imageBase64) {
          return {
            source: "supabase_edge_function",
            mimeType: payload.mimeType || "image/png",
            dataUrl: `data:${payload.mimeType || "image/png"};base64,${payload.imageBase64}`,
          };
        }
      }
    } catch {
      // Fall back to the local placeholder below.
    }
  }

  return {
    source: "local_fallback",
    mimeType: "image/svg+xml",
    dataUrl: buildFallbackTryOnUrl({
      selfieDataUrl: params.selfieDataUrl,
      productImageUrl: params.productImageUrl,
      productTitle: params.productTitle,
    }),
  };
}
