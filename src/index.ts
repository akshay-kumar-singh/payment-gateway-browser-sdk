/**
 * payment-gateway-browser-sdk — the hosted web checkout SDK.
 *
 * This runs on the MERCHANT'S page. It holds nothing secret. Its whole job is to open
 * the gateway-hosted checkout and tell the merchant what happened.
 *
 * The checkout itself is a page served by the gateway. Card and UPI details are typed
 * there, never on the merchant's page — the browser's same-origin policy means the
 * merchant's JavaScript physically cannot read those fields. That is what keeps
 * merchants out of PCI-DSS scope, and it is the reason this SDK is so small: all the
 * real UI lives on our side and can change daily without anyone redeploying.
 */

export type Mode = 'sandbox' | 'production';

/**
 * Where the checkout opens.
 *  _self   navigate this tab           (default)
 *  _blank  new tab
 *  _top    break out of any iframe
 *  _modal  popup overlay, page stays   (best UX)
 *  Element render inline into that element
 */
export type RedirectTarget = '_self' | '_blank' | '_top' | '_modal' | HTMLElement;

export interface CheckoutOptions {
  /** From your server's create-order call. Never build this in the browser. */
  paymentSessionId: string;
  redirectTarget?: RedirectTarget;
  /** Where to send the customer after a redirect checkout. Overrides the order's. */
  returnUrl?: string;
}

export interface CheckoutResult {
  /** Present when the customer finished a payment attempt. */
  paymentDetails?: {
    orderId: string;
    paymentId: string;
    paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
    paymentMessage: string;
  };
  /** Present when something stopped the attempt (bad session, closed window). */
  error?: { code: string; message: string; type: string };
  /** True when the customer dismissed the popup without paying. */
  dismissed?: boolean;
}

export interface LoadOptions {
  mode?: Mode;
  /**
   * Override the checkout origin. You will not need this in production — it exists
   * so you can point at a locally running gateway while developing.
   */
  checkoutOrigin?: string;
}

// This test gateway is a single deployment, so both modes resolve to it. A real
// gateway would have genuinely separate sandbox and production hosts.
const ORIGINS: Record<Mode, string> = {
  sandbox: 'https://payment-gateway-api-1juk.onrender.com',
  production: 'https://payment-gateway-api-1juk.onrender.com',
};

const FRAME_STYLE =
  'position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0;' +
  'z-index:2147483647;background:transparent;';

type Message = { type?: string; payload?: unknown };

export interface PaymentGateway {
  checkout(options: CheckoutOptions): Promise<CheckoutResult>;
  version: string;
  mode: Mode;
}

export const version = '1.0.0';

/**
 * Create a payment gateway instance.
 *
 *   const gateway = await load({ mode: 'sandbox' });
 *   await gateway.checkout({ paymentSessionId, redirectTarget: '_modal' });
 *
 * Returns null on the server, so `import`ing this in Next.js or Remix does not crash.
 */
export async function load(options: LoadOptions = {}): Promise<PaymentGateway | null> {
  if (typeof window === 'undefined') return null;

  const mode: Mode = options.mode ?? 'sandbox';
  const origin = (options.checkoutOrigin ?? ORIGINS[mode]).replace(/\/$/, '');

  return {
    version,
    mode,
    checkout: (opts) => runCheckout(origin, opts),
  };
}

/* ------------------------------------------------------------------ internals */

function checkoutUrl(origin: string, opts: CheckoutOptions): string {
  const url = new URL('/checkout', origin);
  url.searchParams.set('session', opts.paymentSessionId);
  if (opts.returnUrl) url.searchParams.set('return_url', opts.returnUrl);
  return url.toString();
}

function runCheckout(origin: string, opts: CheckoutOptions): Promise<CheckoutResult> {
  if (!opts?.paymentSessionId) {
    return Promise.reject(
      new Error('payment-gateway-browser-sdk: paymentSessionId is required. Create an order on your server first.'),
    );
  }

  const target = opts.redirectTarget ?? '_self';

  // Redirect variants navigate away. Nothing resolves — the browser leaves the page,
  // and the result is handled at your return_url.
  if (target === '_self' || target === '_top') {
    window.location.assign(checkoutUrl(origin, opts));
    return new Promise(() => {});
  }
  if (target === '_blank') {
    window.open(checkoutUrl(origin, opts), '_blank', 'noopener');
    return new Promise(() => {});
  }

  // Popup and inline both keep the page, so both resolve a promise.
  const inline = target !== '_modal';
  return mount(origin, opts, inline ? (target as HTMLElement) : null);
}

function mount(
  origin: string,
  opts: CheckoutOptions,
  container: HTMLElement | null,
): Promise<CheckoutResult> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.src = checkoutUrl(origin, opts);
    frame.title = 'Secure checkout';
    frame.allow = 'payment';

    if (container) {
      frame.style.cssText = 'width:100%;border:0;display:block;min-height:520px;';
      container.appendChild(frame);
    } else {
      frame.style.cssText = FRAME_STYLE;
      document.body.appendChild(frame);
      document.documentElement.style.overflow = 'hidden';
    }

    let done = false;
    const finish = (result: CheckoutResult) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      document.removeEventListener('keydown', onKey);
      if (!container) document.documentElement.style.overflow = '';
      frame.remove();
      resolve(result);
    };

    function onMessage(event: MessageEvent) {
      // The security check. Without it any page could post a fake success and
      // convince the merchant a payment happened.
      if (event.origin !== origin) return;
      if (event.source !== frame.contentWindow) return;

      const data = event.data as Message | null;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'pg:ready':
          frame.contentWindow?.postMessage(
            { type: 'pg:init', payload: { parentOrigin: window.location.origin } },
            origin,
          );
          break;
        case 'pg:resize':
          if (container) {
            const h = (data.payload as { height?: number })?.height;
            if (h) frame.style.height = `${h}px`;
          }
          break;
        case 'pg:complete':
          finish(data.payload as CheckoutResult);
          break;
        case 'pg:dismiss':
          finish({ dismissed: true });
          break;
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !container) {
        frame.contentWindow?.postMessage({ type: 'pg:request-dismiss' }, origin);
      }
    }

    window.addEventListener('message', onMessage);
    document.addEventListener('keydown', onKey);
  });
}

export default load;
