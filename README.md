# payment-gateway-browser-sdk

The hosted web checkout SDK. **1.3 KB gzipped, zero dependencies.**

```bash
npm install payment-gateway-browser-sdk
```

Or via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/payment-gateway-browser-sdk@1/dist/payment-gateway.min.js"></script>
```


## Try it right now

There is no signup. The sandbox ships with one seeded test merchant:

```bash title=".env"
PG_CLIENT_ID=TEST_clientid_demo
PG_CLIENT_SECRET=pgsk_TEST_secret_demo_00000000
```

Both SDKs already point at the hosted sandbox, so these two values are the whole setup.
The keys are public deliberately — they move no real money.

> **The sandbox sleeps.** It runs on a free host, so the first request after an idle spell
> can take 30–60 seconds to wake. Requests after that are fast.

> **Your origin must be allowed.** The checkout is framed and the gateway sets
> `frame-ancestors`, so it will not open on an origin it does not know.
> `localhost:5173` and `localhost:3000` work out of the box. For any other origin, run
> the gateway yourself with `ALLOWED_ORIGINS=https://yoursite.com` (or `*` while
> experimenting locally).

## Usage

```js
import { load } from 'payment-gateway-browser-sdk';

// paymentSessionId comes from YOUR server — see payment-gateway-node-sdk
const gateway = await load({ mode: 'sandbox' });
const result = await gateway.checkout({ paymentSessionId, redirectTarget: '_modal' });
```

`redirectTarget`: `_self` (default), `_blank`, `_top`, `_modal`, or a DOM element.
Only `_modal` and inline resolve a promise — the redirect variants navigate away.

> The result comes from the browser. Treat it as a UI hint, never proof. Confirm on your
> server with `orders.fetch()` before shipping anything.

Full docs: https://payment-gateway-docs.netlify.app/sdk/js

## Develop

```bash
npm install
npm run build      # dist/index.js (ESM), index.cjs, payment-gateway.min.js (IIFE), index.d.ts
```

MIT
