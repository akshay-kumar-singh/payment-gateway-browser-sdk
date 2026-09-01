import { defineConfig } from 'tsup';

export default defineConfig([
  // For bundlers: npm i payment-gateway-browser-sdk
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: true,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  },
  // For a plain <script> tag off the CDN. Defines window.PaymentGateway.
  {
    entry: { 'payment-gateway': 'src/index.ts' },
    format: ['iife'],
    globalName: 'PaymentGateway',
    minify: true,
    dts: false,
    outExtension: () => ({ js: '.min.js' }),
    footer: {
      // Let `PaymentGateway.load(...)` and `PaymentGateway(...)` both work from the global.
      js: 'if(typeof window!=="undefined"&&window.PaymentGateway&&window.PaymentGateway.load){window.PaymentGateway=Object.assign(window.PaymentGateway.load,window.PaymentGateway);}',
    },
  },
]);
