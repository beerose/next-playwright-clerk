# Next.js + Playwright + Clerk

### Getting Started

To run the current example test, you'll need dev instance keys.

You need the following environment variables in the `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXX
CLERK_SECRET_KEY=sk_test_XXX
```

### Install dependencies

```bash
pnpm i
```

### Install test dependencies

```bash
pnpx playwright install-deps
```

### Run tests

```bash
pnpm run test:e2e
```
