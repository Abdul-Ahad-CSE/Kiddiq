# Strikethrough Discount Pricing (TSK-028)

## Overview
Implement an optional discount pricing feature (`discountPrice`) for products. If a product has a discount price, the storefront displays the discount price prominently, renders the regular price crossed out with a strikethrough line and appended with "(Full Price)" next to it, displays a dynamic `[X]% OFF` badge on the product image, and charges the discount price as the active base price in the cart and checkout backend.

## Project Type
WEB (Next.js & React App)

## Success Criteria
1. Prisma model updated with optional `discountPrice` field.
2. Zod validations reject discount prices greater than or equal to regular prices.
3. Product card displays strikethrough full price and dynamic `[X]% OFF` corner badge.
4. Product details page shows strikethrough pricing and updates the WhatsApp order template price.
5. Cart and checkout server-side validation evaluate the discounted price as the active price.
6. All audits (TypeScript compiler, linter, UX accessibility, and Purple Ban compliance) pass.

## Tech Stack
- **ORM**: Prisma (PostgreSQL database)
- **Validation**: Zod
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Framework**: Next.js App Router (React 19)

## File Structure
- [prisma/schema.prisma](file:///f:/Level_2/Kiddiq/prisma/schema.prisma) (Database schema)
- [src/app/actions/admin-products.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-products.ts) (Admin product actions & Zod validation)
- [src/app/admin/products/ProductManagementClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/products/ProductManagementClient.tsx) (Admin modal inputs)
- [src/components/ProductCard.tsx](file:///f:/Level_2/Kiddiq/src/components/ProductCard.tsx) (Storefront card rendering & cart actions)
- [src/app/product/[slug]/ProductDetailsClient.tsx](file:///f:/Level_2/Kiddiq/src/app/product/[slug]/ProductDetailsClient.tsx) (Details page rendering & cart actions)
- [src/app/actions/order.ts](file:///f:/Level_2/Kiddiq/src/app/actions/order.ts) (Backend order checkout verification)

---

## Task Breakdown

### Foundation (P0)
- [x] **Task 1: Update Prisma Schema & Database**
  - **Agent**: `database-architect`
  - **Skills**: `database-design`
  - **INPUT**: [prisma/schema.prisma](file:///f:/Level_2/Kiddiq/prisma/schema.prisma)
  - **OUTPUT**: Updated schema client
  - **Action**: Add `discountPrice Float?` to the `Product` model. Run `npx prisma db push` to push to the database and regenerate client types.
  - **Verify**: Client compiles cleanly.

### Core Backend (P1)
- [x] **Task 2: Update Admin Validation Schema & Mutations**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`, `nodejs-best-practices`
  - **INPUT**: [src/app/actions/admin-products.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-products.ts)
  - **OUTPUT**: Updated server actions Zod schemas and DB writes
  - **Action**: 
    - Add `discountPrice: z.number().nonnegative("Discount price cannot be negative").nullish()` to `productSchema`.
    - Refine `productSchema` with `.refine` ensuring that if `discountPrice` is provided, it is strictly less than `price`.
    - Map `discountPrice: validated.discountPrice` in `createProduct` and `updateProduct` queries.
    - Write old/new value changes to audit logs.
  - **Verify**: TypeScript check passes.

- [x] **Task 3: Sync Checkout Backend Pricing Validations**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`
  - **INPUT**: [src/app/actions/order.ts](file:///f:/Level_2/Kiddiq/src/app/actions/order.ts)
  - **OUTPUT**: Secure checkout price checks
  - **Action**:
    - Update `createOrder` to fetch `discountPrice` from product records.
    - Compute `activePrice = dbProduct.discountPrice && dbProduct.discountPrice > 0 ? dbProduct.discountPrice : dbProduct.price`.
    - Evaluate preorder advance/remaining balances, standard subtotals, and JSON serialized item logs using `activePrice`.
  - **Verify**: Submission checks succeed.

### User Interface (P2)
- [x] **Task 4: Add Discount Price Fields in Admin Modals**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `tailwind-patterns`
  - **INPUT**: [src/app/admin/products/ProductManagementClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/products/ProductManagementClient.tsx)
  - **OUTPUT**: Updated modal inputs next to regular price
  - **Action**:
    - Extend `Product` interface and `formState` to include `discountPrice?: number | null`.
    - Render number input field for **"Discount Price (৳ BDT)"** directly next to "Regular Price" inside the `grid-cols-2` wrapper.
    - Enforce a minimum touch height of `h-12` (48px) and implement client-side validations inside `handleFormSubmit` (`discountPrice < price`).
  - **Verify**: Check layout alignment and form submission updates.

- [x] **Task 5: Implement Product Card Strikethrough & Badge**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`
  - **INPUT**: [src/components/ProductCard.tsx](file:///f:/Level_2/Kiddiq/src/components/ProductCard.tsx)
  - **OUTPUT**: Cross-out layout and image discount badge
  - **Action**:
    - Add `discountPrice?: number | null` to `ProductCardProps`.
    - Calculate percentage off: `Math.round(((product.price - product.discountPrice) / product.price) * 100)`. Renders dynamic emerald badge `[X]% OFF` at the top-right image wrapper (below the wishlist trigger).
    - If `discountPrice` is active, render it in bold, and render the regular price crossed out: `~~৳[price] (Full Price)~~` in smaller slate color next to it.
    - Update `handleAddToCart` and `handleBuyNow` click handlers to pass `price: product.discountPrice` if available.
  - **Verify**: Component compiles and displays.

- [x] **Task 6: Implement Product Details Pricing & WhatsApp Templates**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `nextjs-react-expert`
  - **INPUT**: [src/app/product/[slug]/ProductDetailsClient.tsx](file:///f:/Level_2/Kiddiq/src/app/product/[slug]/ProductDetailsClient.tsx)
  - **OUTPUT**: Crossed out pricing and updated WhatsApp text templates
  - **Action**:
    - If `discountPrice` is active, render active price and strikethrough price in details header.
    - Update click actions (`handleAddToCart`/`handleBuyNow`) to use `discountPrice` as price payload.
    - Format WhatsApp template query text using `discountPrice` as active price.
  - **Verify**: Strikethrough pricing renders properly.

### Verification (Phase X)
- [x] **Task 7: Run Quality Verification Suite**
  - **Agent**: `test-engineer`
  - **Skills**: `testing-patterns`, `lint-and-validate`
  - **INPUT**: Codebase
  - **OUTPUT**: Passing audit reports
  - **Action**:
    - Run type check: `npx tsc --noEmit`
    - Run lint check: `npm run lint`
    - Run build test: `npm run build`
    - Execute master checklist: `python -X utf8 .agents/scripts/checklist.py .`
  - **Verify**: Script returns success.

---

## Done When
- [x] Prisma model and admin dashboard actions record `discountPrice` correctly.
- [x] Product Card and Details page conditionally render discounted prices and strikethrough regular prices.
- [x] Dynamic discount percentage badge (`[X]% OFF`) is displayed on card images.
- [x] Cart subtotals, coupon minOrderAmount checks, and backend order validations charge the discounted price.
- [x] Complies with standard touch target heights ($\ge 44$px) and the Purple Ban.
