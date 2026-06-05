# Homepage Layout & Scroll Animations (TSK-007)

## Goal
Build a premium, parent-focused homepage for Kiddiq featuring a Hero Banner, Shop by Category grid, Best Sellers grid, Brand Benefits, and Testimonials with scroll reveals and hover animations.

## Open Questions (Socratic Gate)
- **Framer Motion Installation**: The `framer-motion` dependency is not currently present in `package.json`. Do you approve running `npm install framer-motion` to enable dynamic React animations, or would you prefer us to use Tailwind CSS v4's custom animations and CSS transitions to keep bundle size lightweight?
- **Category Grid Source & Sync**: The spec lists 6 categories (Educational Toys, STEM Toys, Puzzles, Montessori, Arts, School Supplies), but the seeded DB has 3 flat categories (Educational Toys, School Supplies, Parenting Resources). Should we update `prisma/seed.ts` and sync the database to have all 6 categories, or should the UI dynamically group them, or should we align the homepage grid with the 3 DB categories?
- **Best Sellers Source**: Should the Best Sellers grid fetch products from the PostgreSQL database using Prisma (e.g., query products where `featured = true`), or should we use hardcoded local mock data in the component?
  - *(Recommended: Fetch featured products from the database in a Server Component and pass them as props to the Client Component grid).*

## Proposed Changes
- **[NEW]** `src/components/FramerWrapper.tsx`: A lightweight helper or client component wrapper for Framer Motion or transition effects.
- **[NEW]** `src/components/ProductCard.tsx`: Reusable product card component supporting image zoom, hover glows, and "Add to Cart"/"Wishlist" hooks.
- **[MODIFY]** `src/app/page.tsx`: Rebuild the homepage with:
  - Hero Section (Left-aligned text/CTA/trust, right-aligned illustration placeholder)
  - Categories Grid (links to filtered shop)
  - Best Sellers Grid (reusable product cards)
  - Why Parents Choose Kiddiq (benefits list with icons)
  - Testimonials (parent quotes and star ratings)

## Tasks
- [ ] **Task 1: Install framer-motion (conditional)** → Verify: Command completes and dependency appears in `package.json`.
- [ ] **Task 2: Setup FramerWrapper / Animation Config** → Verify: File compiles cleanly.
- [ ] **Task 3: Create Reusable ProductCard Component** → Verify: Compiles cleanly and handles cart/wishlist Zustand events.
- [ ] **Task 4: Build Hero Section with Placeholders** → Verify: Left-aligned content/CTA, right-aligned placeholder image with floating transition.
- [ ] **Task 5: Build Shop by Category Grid** → Verify: Renders categories, card-lift hover animations, and link points.
- [ ] **Task 6: Build Best Sellers Grid (DB-backed)** → Verify: Renders featured products fetched from database.
- [ ] **Task 7: Build Benefits & Testimonials Sections** → Verify: Grid and review layouts match visual guidelines.
- [x] **Task 1: Install framer-motion (conditional)** → Verify: Command completes and dependency appears in `package.json`.
- [x] **Task 2: Setup FramerWrapper / Animation Config** → Verify: File compiles cleanly.
- [x] **Task 3: Create Reusable ProductCard Component** → Verify: Compiles cleanly and handles cart/wishlist Zustand events.
- [x] **Task 4: Build Hero Section with Placeholders** → Verify: Left-aligned content/CTA, right-aligned placeholder image with floating transition.
- [x] **Task 5: Build Shop by Category Grid** → Verify: Renders categories, card-lift hover animations, and link points.
- [x] **Task 6: Build Best Sellers Grid (DB-backed)** → Verify: Renders featured products fetched from database.
- [x] **Task 7: Build Benefits & Testimonials Sections** → Verify: Grid and review layouts match visual guidelines.
- [x] **Task 8: Add scroll reveals and transition glows** → Verify: No purple colors are used; animations are subtle and responsive.

## Done When
- [x] Homepage compiles and builds without warning.
- [x] Purple Ban strictly enforced (no purple colors).
- [x] Linter and TypeScript checks pass.
- [x] Master verification script `checklist.py` returns green.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-05

