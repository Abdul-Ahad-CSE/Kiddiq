# Pre-order System & Feature Flagging (TSK-026)

## Goal
Implement a modular, toggleable Pre-order system where customers can secure upcoming products with a 50% advance payment, managed via admin toggles and toggleable via environment variables.

## Tasks
- [x] Task 1: Update Prisma schema with preorder fields (`isPreorder`, `preorderAdvancePercent`, `preorderETA`) on the `Product` model and sync DB using `npx prisma db push`. → Verify: Run tsc checks and inspect Prisma client types.
- [x] Task 2: Modify Zod schemas and DB mutations in `src/app/actions/admin-products.ts` to support and log preorder properties. → Verify: Product creation/update action logs cost/pre-order properties properly.
- [x] Task 3: Update `src/app/admin/products/ProductManagementClient.tsx` to conditionally render Pre-order inputs in modals, wrapped in the `NEXT_PUBLIC_ENABLE_PREORDERS === 'true'` check. → Verify: Form submits toggle values correctly.
- [x] Task 4: Extend `useCartStore` Zustand store to calculate the 50% advance dynamically without mutating base prices. → Verify: Subtotal displays exactly 50% of base price for pre-orders.
- [x] Task 5: Refactor Checkout delivery charge rules in `CheckoutClient.tsx` and the checkout order submission action to evaluate mixed vs preorder-only carts. → Verify: Shipping is 0 BDT on all-preorder carts, standard on mixed.
- [x] Task 6: Add pre-orders homepage showcase grid and route `/pre-orders` protected by feature flag checks. → Verify: Renders showcase when flag is true; hides/omits when false.
- [x] Task 7: Run quality verification checks. → Verify: TypeScript compiler, linter, and validation checklist pass successfully.

## Done When
- [x] System is toggleable via `NEXT_PUBLIC_ENABLE_PREORDERS` environment variable.
- [x] Cart/Checkout calculates 50% advance for pre-orders.
- [x] Free shipping on all-preorder carts; standard shipping on mixed and normal carts.
- [x] Admin can toggle pre-order status and ETA.
