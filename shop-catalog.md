# Implementation Plan: Shop Catalog with Dynamic Filtering & Search (TSK-008)

## Goal
Build a mobile-first, highly responsive, and SEO-optimized Shop Catalog page at `/shop` utilizing a hybrid Server-Side rendering and Client-Side dynamic filtering architecture. The page will fetch the full products and categories list on the server for SEO indexing, and then use Client-side state (`useMemo`) to perform real-time instant searches, price range sliders, age-group multi-selects, and sorting transitions without page refresh or input focus loss.

---

## User Review Required

> [!IMPORTANT]
> - **Client-Side Filtering with SSR**: The server component will fetch all categories and products from Prisma and pass them as initial props to the client catalog component. This allows search engines to crawl the complete "All" products page (SEO) while enabling instant, zero-latency filters and search updates on the client.
> - **Mobile bottom Sheet Layout**: On mobile viewports (below `md`), the filters will pop up as a half-screen bottom sheet triggered by a sticky bottom action bar, allowing the user to view the top half of the product grid. On desktop viewports (`md` and up), the filters will render as a traditional sidebar for optimized screen space usage.
> - **Touch Targets & Colors**: All buttons, select tabs, and checkboxes will strictly adhere to the `44x44px` touch target size guidelines and comply with the **Purple Ban** (using brand blues, greens, and yellow accents).

---

## Open Questions

### P0: **DESKTOP LAYOUT CONVENTION**
**Question:** Should the dynamic filter panel render as a traditional persistent left sidebar on desktop viewports, or should we use the bottom/side drawer modal on all screen sizes?

**Why This Matters:**
- Affects responsive layout structure and grid columns scaling.
- Traditional sidebars are standard for desktop e-commerce and maximize layout efficiency on wide screens.

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **A (Sidebar on Desktop)** | Premium, standard e-commerce layout; uses wide-screen space. | Requires coding two layout paths. | Standard desktop desktop storefront. |
| **B (Drawer on all screens)** | Single unified layout component across all viewports. | Sub-optimal desktop UX (wasted whitespace on sides). | Very simple catalog structures. |

**If Not Specified:** Option A (recommended and default).

---

### P1: **AGE-GROUP SELECTION SOURCE**
**Question:** Should the age-group multi-select filter choices be statically hardcoded (e.g. "Toddlers", "Preschoolers", "Early Schooling"), or fetched dynamically based on unique `ageGroup` values present in the database products?

**Why This Matters:**
- Static options are clean and easy to translate, but might become out of sync if products are added with new age ranges.
- Dynamic options automatically adapt to seeded database values, preventing discrepancies.

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **A (Dynamic unique values)** | Zero maintenance; matches seeded db products exactly. | Dynamic string formats (e.g. "3+ Years", "Parents") might look unformatted. | Highly flexible databases. |
| **B (Curated static list)** | Clean, beautifully formatted user-facing badges. | Risk of products with new age ranges not appearing in filters. | Well-defined product scopes. |

**If Not Specified:** Option A (dynamic mapping) with string cleanups.

---

### P2: **PRODUCT IMAGE SOURCE**
**Question:** Should we mock product images by copying `public/logo.jpg` into a new product media directory (e.g., `public/images/products/`), or use placeholder images from a public CDN?

**Why This Matters:**
- Local assets resolve all 404 errors during development and ensure fast loading without network dependencies.

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **A (Local mock directory)** | 100% network independent; prevents 404 console errors. | Consumes project folder space. | Robust local dev. |
| **B (CDN Placeholders)** | Keeps repo size small. | Slows initial load; network dependent. | Lightweight repos. |

**If Not Specified:** Option A (local assets).

---

## Proposed Changes

### 1. Route Page Component: `src/app/shop/page.tsx`
- **Type**: Next.js Server Component.
- **SEO & SSR**: Fetches categories and all products on the server using Prisma.
- **Structure**:
  - Wraps the client catalog in a `<Suspense>` boundary.
  - Passes fetched categories and products to the client component `<ShopCatalogClient />`.

### 2. Client Catalog Component: `src/app/shop/ShopCatalogClient.tsx`
- **Type**: Client Component (`"use client"`).
- **State**:
  - `activeCategory` (default: "all")
  - `searchQuery` (debounced internally)
  - `priceRange` (min, max)
  - `selectedAgeGroups` (set/array)
  - `sortBy` (default: "newest")
  - `isFilterSheetOpen` (boolean, triggers mobile bottom sheet modal)
- **Calculations**:
  - Use `useMemo` to filter and sort `products` list dynamically based on category, search text, price range, and active age groups.
- **Layout**:
  - Responsive categories navigation tab bar at the top (All, Educational Toys, School Supplies, Parenting Resources).
  - Main area: Left sidebar for filters (desktop only) and 2-column Product Grid (all viewports).
  - Sticky bottom action bar (mobile only) showing "Filters & Search".
  - Half-screen Bottom Sheet modal containing: Search input, Price range slider, Age-group checkboxes, and Sort dropdown.

### 3. Reusable Product Card: `src/components/ProductCard.tsx`
- Update component to utilize Next.js `<Image />` component with configured layout dimensions, preloaded placeholders, and lazy rendering.

---

## Verification Plan

### Automated Checks
```powershell
npx tsc --noEmit
npm run lint
python -X utf8 .agents/scripts/checklist.py .
```

### Manual Verification
1. **Initial Rendering**: Verify that visiting `/shop` displays all products and that search engines crawl the server-rendered HTML.
2. **Category Tabs**: Click categories; verify the product grid updates instantly.
3. **Instant Search**: Type search terms; verify the grid updates instantly without losing input focus.
4. **Bottom Sheet Trigger**: On mobile, verify the sticky bottom bar is visible and clicking it opens the half-screen sheet.
5. **Mobile Grid**: Confirm the grid renders in exactly 2 columns on mobile.
6. **Price & Age Filtering**: Check sorting and dynamic filter criteria.
