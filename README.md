# payment-gateway-browser-sdk

The Paywize web checkout SDK. **1.3 KB gzipped, zero dependencies.**

```bash
npm install payment-gateway-browser-sdk
```

Or via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/payment-gateway-browser-sdk@1/dist/paywize.min.js"></script>
```

## Usage

```js
import { load } from 'payment-gateway-browser-sdk';

// paymentSessionId comes from YOUR server — see paywize-pg
const paywize = await load({ mode: 'sandbox' });
const result = await paywize.checkout({ paymentSessionId, redirectTarget: '_modal' });
```

`redirectTarget`: `_self` (default), `_blank`, `_top`, `_modal`, or a DOM element.
Only `_modal` and inline resolve a promise — the redirect variants navigate away.

> The result comes from the browser. Treat it as a UI hint, never proof. Confirm on your
> server with `orders.fetch()` before shipping anything.

Full docs: https://docs.paywize.in/sdk/js

## Develop

```bash
npm install
npm run build      # dist/index.js (ESM), index.cjs, paywize.min.js (IIFE), index.d.ts
```

MIT
