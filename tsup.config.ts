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
  // For a plain <script> tag off the CDN. Defines window.Paywize.
  {
    entry: { paywize: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Paywize',
    minify: true,
    dts: false,
    outExtension: () => ({ js: '.min.js' }),
    footer: {
      // Let `Paywize.load(...)` and `Paywize(...)` both work from the global.
      js: 'if(typeof window!=="undefined"&&window.Paywize&&window.Paywize.load){window.Paywize=Object.assign(window.Paywize.load,window.Paywize);}',
    },
  },
]);
