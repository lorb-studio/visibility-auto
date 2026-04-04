# visibility-auto — Build Chain

## Status

phase: build

## Goal

Build @lorb/visibility-auto: 3-line content-visibility:auto automation. Ship-ready v0.1.

## Constraints

- Output: products/visibility-auto/
- Spec: knowledge/products/visibility-auto/spec.md
- Build must pass: `npm run build -w products/visibility-auto`
- Tests must pass: `npm test -w products/visibility-auto`
- Zero dependencies. ESM only. TypeScript
- Bundle < 2KB gzip
- Follow monorepo patterns from products/otd/ or products/cloak/ for package.json and tsconfig

## Task List

### v0.1 Build

- [x] Scaffold: package.json, tsconfig.json, vitest.config.ts, src/index.ts
- [x] Core: measure section heights, apply content-visibility:auto + contain-intrinsic-size
- [x] init() entry point with options (selector, threshold, onChange)
- [x] MutationObserver for dynamically added sections
- [x] Resize handler (debounced re-measure)
- [x] SSR guard (no-op when document undefined)
- [x] Cleanup function returned from init()
- [x] Unit tests: measure, apply, cleanup, SSR, dynamic sections, resize
- [x] Build verification: tsc --noEmit + bundle size check (1,047B gzip, 20/20 tests pass)
- [x] Benchmark test page: 1000 sections performance comparison
