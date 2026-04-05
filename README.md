## AI Stylist

AI Stylist is a Shopify app in progress using:

- Next.js for the app server and admin UI
- Supabase for database, storage, and AI-oriented backend services
- Cloudflare Tunnel for local development URLs
- a guest-first shopper model for profile and cart intent state

## Current State

The repository has been migrated away from Remix and now uses a root-level Next.js app.

Already implemented:

- guest-first browser shopper session model
- guest profile and cart intent persistence
- Next.js dashboard describing the chosen architecture
- health endpoint at `/api/health`
- merchant-only Shopify auth and billing gate
- coupon-backed paid app activation flow
- guest storefront APIs for product context, outfit generation, and add-on recommendations
- storefront demo page at `/storefront-demo`
- theme app extension scaffold for home, collection, and product blocks
- PDP try-on API and demo flow at `/try-on-demo`
- Supabase Storage buckets for try-on uploads and generated outputs
- Supabase Edge Function scaffold for Gemini-powered try-on generation

Not implemented yet:

- embedded admin App Bridge integration
- live Shopify catalog ingestion into guest storefront APIs
- real add-to-cart AJAX wiring from storefront recommendations
- AI model-backed outfit generation beyond heuristic/demo ranking
- real model-backed try-on generation provider integration
- production secret wiring for the deployed Gemini try-on function

## Cloudflare Dev Workflow

Run the Next.js app locally:

```bash
npm run dev:cloudflare
```

Start a Cloudflare tunnel in a second terminal:

```bash
npm run start:cloudflare
```

Cloudflare will print a public URL such as:

```text
https://something.trycloudflare.com
```

Put that URL into `.env`:

```dotenv
SHOPIFY_APP_URL=https://something.trycloudflare.com
```

For Shopify CLI preview with the theme app extension included:

```bash
npm run dev:shopify
```

This uses `shopify app dev` so the app and the `extensions/ai-stylist-storefront`
theme app extension can be previewed together in the connected dev store theme.

## Cloudflare Production Deployment

This repository is now prepared for production deployment to Cloudflare Workers
using OpenNext.

Relevant files:

- `wrangler.jsonc`
- `open-next.config.ts`
- `.github/workflows/deploy.yml`
- `public/_headers`

Core deployment commands:

```bash
npm run preview
npm run deploy:cloudflare
```

## GitHub Auto-Deploy Flow

The GitHub Actions workflow at `.github/workflows/deploy.yml` is designed to:

1. install dependencies
2. run lint and build checks
3. build the OpenNext Cloudflare bundle
4. deploy to Cloudflare
5. create a GitHub release
6. optionally run `shopify app deploy` if Shopify CLI credentials are present

### Required GitHub secrets

For Cloudflare deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

For optional Shopify deploy:

- `SHOPIFY_CLI_PARTNERS_TOKEN`

### Shopify production note

The Shopify deploy step in CI assumes you will create and link a production app
configuration file before using automated deploys. The current workflow calls:

```bash
shopify app deploy --config production --allow-updates
```

So before enabling the Shopify step, create the production-linked config locally
with Shopify CLI and commit that production config file.

### Stable production URL

For production, `SHOPIFY_APP_URL` should point to your stable Cloudflare-hosted
domain, not a temporary tunnel URL.

Example:

```dotenv
SHOPIFY_APP_URL=https://app.aistylist.com
```

## Local Checks

Run lint:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

Run both:

```bash
npm run check
```

## Health Endpoint

Once local dev is running, verify the app responds at:

- `http://127.0.0.1:3000/api/health`

Expected JSON:

```json
{
  "ok": true,
  "app": "AI Stylist",
  "framework": "nextjs",
  "backend": "supabase",
  "tunnel": "cloudflare"
}
```

## Next Steps

1. Add Shopify auth/session handling in Next.js.
2. Wire Supabase config and shared data clients.
3. Create a production Shopify config file for CI deploys.
4. Build the embedded admin shell and merchant settings pages.
5. Add storefront-facing APIs for outfit generation and cart intent.
6. Install the theme app extension blocks into the dev theme and point them at the app URL.

## Storefront Block Testing

The repository now includes a theme app extension scaffold at:

- `extensions/ai-stylist-storefront`

Available blocks:

- home recommendation block
- collection outfit block
- product detail outfit block

The current recommended storefront feature path is now the PDP try-on flow:

1. add the product detail AI Stylist block to a product template
2. click `Try on me`
3. upload a shopper selfie
4. store the selfie in Supabase Storage
5. generate a preview image for the current product
6. store the generated result in Supabase Storage

Current storage buckets:

- `try-on-inputs` for uploaded shopper images
- `try-on-results` for generated try-on outputs

Suggested local test sequence:

1. Start the Next.js app and expose it with Cloudflare tunnel.
2. Update `SHOPIFY_APP_URL` to the current public URL.
3. Run `npm run dev:shopify`.
4. Open the Shopify theme editor for the dev store.
5. Add the AI Stylist blocks to home, collection, and product templates.
6. Click the generate button inside each block and confirm recommendations render.
7. On the PDP block, use the add-on buttons and verify items are posted to `/cart/add.js`.
