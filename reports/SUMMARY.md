# MediaSyndicate Code Quality Report

Date: Wed Nov 26 17:14:12 CET 2025

## TypeScript

## ESLint

> mediasyndicate@0.1.0 lint
> next lint

`next lint` is deprecated and will be removed in Next.js 16.
For new projects, use create-next-app to choose your preferred linter.
For existing projects, migrate to the ESLint CLI:
npx @next/codemod@canary next-lint-to-eslint-cli .

✔ No ESLint warnings or errors

## Statistics
=== Lines of Code ===
      13 lib/prisma.ts
      14 lib/config.ts
      20 app/layout.tsx
      21 app/api/import/route.ts
      27 app/api/health/route.ts
      43 app/page.tsx
      50 lib/services/RSSParser.ts
      82 lib/services/ImportService.ts
     270 total

=== File Count ===
       8

=== Largest Files ===
     270 total
      82 lib/services/ImportService.ts
      50 lib/services/RSSParser.ts
      43 app/page.tsx
      27 app/api/health/route.ts
      21 app/api/import/route.ts
      20 app/layout.tsx
      14 lib/config.ts
      13 lib/prisma.ts

## Security
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0,

## Build Size
Route (app)                                 Size  First Load JS
+ First Load JS shared by all             102 kB
