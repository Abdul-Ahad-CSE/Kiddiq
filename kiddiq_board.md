# Kiddiq E-Commerce & Order Management Platform - Project Board

This project board outlines the complete development lifecycle for **Kiddiq**, a premium children's brain development store. It spans database design, user authentication, customer storefront pages, dynamic local payment & checkout processing, and an admin dashboard.

---

## 📋 Overview
- **Project Name**: Kiddiq
- **Project Type**: WEB (Next.js, React, TypeScript)
- **Primary Agent**: `frontend-specialist` (collaboration with `backend-specialist` & `database-architect`)
- **Key Target**: Dynamic local payment checkout (bKash/Nagad), dynamic delivery charge, WhatsApp support integration, flat category architecture, and an admin verification system.

---

## ⚙️ Development Guidelines
1. **Task Planning**: When starting any task, the agent must always create a detailed, described plan of that single task first.
2. **Git Workflow**: The user will manage the git repository, updates, and pushes to remote manually. The agent should focus purely on local code edits and updates.

---


## 🎯 Success Criteria
1. Fully functional storefront with flat category navigation (Educational Toys, School Supplies, Parenting Resources).
2. Dynamic local delivery charge updating in real-time (60 BDT for Chittagong City, 120 BDT elsewhere) without external API dependencies.
3. Hybrid checkout model (COD with delivery charge paid in advance OR full advance payment) integrated with manual bKash/Nagad tracking.
4. Prefilled WhatsApp order confirmation payload based on form input.
5. Admin dashboard for order verification, metrics display, search/filter, and order state transition (pending to delivered).
6. Compliance with "Purple Ban" (no violet or purple hex codes in the styling).
7. Clean typescript compilation, passing lint rules, and green check results on `verify_all.py` / `checklist.py`.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14/15 (App Router), React 18/19, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion (for smooth micro-animations)
- **State & Forms**: Zustand (Cart & Wishlist), React Hook Form, Zod
- **Database & Auth**: PostgreSQL (Neon DB), Prisma ORM, NextAuth.js
- **Media & Uploads**: Cloudinary (or local fallback mocks)

---

## 📁 Proposed File Structure
```plaintext
kiddiq/
├── .agents/                    # Agent configuration and validation tools
├── prisma/
│   ├── schema.prisma           # Relational model layout
│   └── seed.ts                 # Database seeding (categories, zones, mock products)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Google Font: Inter/Outfit)
│   │   ├── page.tsx            # Home page (Hero, featured items, benefits)
│   │   ├── shop/
│   │   │   └── page.tsx        # Product list grid with filters
│   │   ├── product/[slug]/
│   │   │   └── page.tsx        # Details page, image carousel, benefits
│   │   ├── checkout/
│   │   │   └── page.tsx        # Dynamic manual verify checkout page
│   │   ├── order-status/
│   │   │   └── [id]/page.tsx   # Visual success/failure screens
│   │   ├── admin/
│   │   │   ├── page.tsx        # Dashboard metrics overview
│   │   │   └── orders/
│   │   │       └── page.tsx    # Interactive order management grid
│   │   ├── login/
│   │   │   └── page.tsx        # Authentication login page
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts # NextAuth handlers
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives (Button, Input, Card)
│   │   ├── ProductCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── FramerWrapper.tsx   # Wrapper for motion components
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── prisma-utils.ts     # DB helper functions
│   │   └── validation.ts       # Zod validation schemas
│   ├── store/
│   │   └── useCartStore.ts     # Zustand store for shopping cart & wishlist
│   └── styles/
│       └── globals.css         # Styling system & Tailwind configurations
```

---

## 📝 Sequential Task Breakdown

### Phase 1: Database & Foundation Setup
Foundation configuration, schema design, and local development setup.

- [x] **TSK-001: Next.js Boilerplate Scaffolding**
  - **Agent**: `frontend-specialist`
  - **Skills**: `app-builder`, `clean-code`
  - **Priority**: `P1`
  - **Dependencies**: `None`
  - **INPUT**: `None`
  - **OUTPUT**: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/styles/globals.css`, `src/lib/upload.ts`
    - Scaffold Next.js project with App Router, TypeScript, and Tailwind CSS.
    - Set up modern typography (e.g., Google Font "Outfit" or "Inter") in `src/app/layout.tsx`.
    - Apply base design token configuration in `globals.css` with soft blues and warm yellow accents. Avoid purple/violet completely.
    - Create an abstracted `uploadMedia(file)` utility in `src/lib/upload.ts` that saves files locally to `/public/uploads/` as a fallback-first architecture (can be swapped for Cloudinary later without changing other components).
  - **VERIFY**: `Boilerplate successfully scaffolded using Next.js 16.2.7 App Router and Tailwind v4. Google Font Outfit has been integrated in layout.tsx. Design colors configured in globals.css (no violet/purple found). Abstracted media upload Server Action created. Verified via npm run build (Success) and checklist.py (All 6 core checks passed).`


- [x] **TSK-002: Prisma Schema Configuration**
  - **Agent**: `database-architect`
  - **Skills**: `database-design`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-001`
  - **INPUT**: `package.json`
  - **OUTPUT**: `prisma/schema.prisma`, `src/lib/db.ts`
    - Define PostgreSQL connection structure using Prisma.
    - Build models: `User` (roles: ADMIN, CUSTOMER), `Category` (flat layout: name, slug, image), `Product` (title, slug, price, ageGroup, images JSON, stock, benefits string, featured boolean), `DeliveryZone` & `DeliveryArea` (enforcing unique name/district), `Order`, `Review`, `Wishlist`.
    - Set up enums for `verificationStatus` (pending, verified, rejected) and `orderStatus` (pending_verification, confirmed, processing, shipped, delivered, cancelled).
  - **VERIFY**: `Prisma schema successfully designed and verified. Installed Prisma & Client (v7.8.0). Database connection configured via prisma.config.ts and local .env file. Models for User, Category, Product, DeliveryZone, DeliveryArea, Order, Review, and Wishlist created. Verified schema structure via npx prisma validate, generated client types via npx prisma generate, and tested compilation with npx tsc --noEmit and next build. Checked and validated via checklist.py.`


- [x] **TSK-003: DB Seeding with Predefined Areas & Mock Data**
  - **Agent**: `database-architect`
  - **Skills**: `database-design`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-002`
  - **INPUT**: `prisma/schema.prisma`
  - **OUTPUT**: `prisma/seed.ts`
    - Write a seed file to populate flat categories (`Educational Toys`, `School Supplies`, `Parenting Resources`).
    - Seed `DeliveryZone` and `DeliveryArea` utilizing the Chittagong City Areas listed in the specification.
    - Add mock products with distinct age groups and benefits to test shop layouts.
    - Seed the first Admin account using credentials retrieved from the environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (defaulting to safe mocks for local dev if not present).
  - **VERIFY**: `Database seeding script created and executed successfully. Installed tsx and configured seed command in prisma.config.ts. Executed npx prisma db push to synchronize the database with Neon PostgreSQL. Seeded flat categories, 41 Chittagong City areas (deliveryCharge = 60), Outside Chittagong default zone (deliveryCharge = 120), mock products, and bootstrap Admin account with hashed password. Verified via execution logs and checklist.py (All 6 core checks passed).`


---

### Phase 2: Authentication & Zustand State Management
User credentials provider configuration and Zustand client state container setup.

- [x] **TSK-004: NextAuth.js Configuration**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`, `nodejs-best-practices`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-002`
  - **INPUT**: `src/lib/db.ts`, `prisma/schema.prisma`
  - **OUTPUT**: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`
    - Configure NextAuth.js credentials provider to authenticate Users.
    - Expose user role (`ADMIN` or `CUSTOMER`) inside JWT and session callbacks.
    - Build login page form with React Hook Form and Zod validation.
  - **VERIFY**: `NextAuth.js authentication configured successfully. Installed next-auth, react-hook-form, zod, @hookform/resolvers, and lucide-react. Created type definitions extending next-auth modules in next-auth.d.ts to include role and id properties. Implemented App Router route handler with credentials check, password hashing lookup, and role JWT callbacks. Built a premium, soft-blue styled LoginPage utilizing React Hook Form with Zod validation. Checked and validated via next build and checklist.py (All core checks passed).`


- [x] **TSK-005: Zustand Global Cart & Wishlist Store**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `clean-code`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-001`
  - **INPUT**: `src/app/layout.tsx`
  - **OUTPUT**: `src/store/useCartStore.ts`
    - Build a Zustand store managing a local cart list (items, quantities, price calculations).
    - Sync cart items to `localStorage` for persistence.
    - Add support for saving products to a local wishlist state.
  - **VERIFY**: `Zustand store successfully built and verified. Installed zustand. Designed CartItem and CartStore interfaces supporting items, wishlist, addItem, removeItem, updateQuantity, clearCart, toggleWishlist, and isInWishlist. Configured localStorage persistence via middleware. Implemented a custom useCartState hook wrapping state transitions in a safe timer callback to completely avoid Next.js App Router hydration mismatches. Verified type safety with npx tsc, Next.js build compilation, and checklist.py (All core checks passed).`


---

### Phase 3: Storefront UI (Product Catalog & Animation)
Public facing catalog, shop filters, and Framer Motion reveals.

- [x] **TSK-006: Navigation Shell (Navbar & Footer)**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-005`
  - **INPUT**: `src/app/layout.tsx`
  - **OUTPUT**: `src/components/Navbar.tsx`, `src/components/Footer.tsx`
    - Design a premium, child-friendly yet highly professional header and footer.
    - Include links to Shop, Home, Cart indicator (badge count), and User Profile / Admin login link.
    - Apply micro-interactions on links and buttons (subtle color shifts, hover lifts).
  - **VERIFY**: `Completed. Copied official logo to public/logo.jpg. Built responsive sticky Navbar.tsx with Zustand cart/wishlist state count badges, category dropdown, and session check props. Built dark high-trust Footer.tsx with flat categories and a direct WhatsApp link to 01825462039. Restructured NextAuth configuration to enable server-side session fetching in layout.tsx. Verified via production build, zero lint warnings, and a green master checklist.py pass.`

- [x] **TSK-007: Home Page Layout & Scroll Animations**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `nextjs-react-expert`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-006`
  - **INPUT**: `src/app/page.tsx`
  - **OUTPUT**: `src/app/page.tsx`, `src/components/FramerWrapper.tsx`
    - Build premium Hero Banner with high-trust taglines ("Brain Development Made Fun").
    - Render sections: Flat Category links, Best Sellers grid, Brand Benefits, and Customer Testimonials.
    - Configure Framer Motion reveals (`whileInView`, scroll-based reveals, and soft grid glow effects).
  - **VERIFY**: `Completed. Installed framer-motion and created FramerWrapper.tsx helper containing FadeIn, Float, and Stagger transition wrappers. Refactored page.tsx to query categories and featured products from PostgreSQL via Prisma. Implemented Hero banner with trust indicators, Shop by Category grid (directing to pre-filtered slugs), Best Sellers product grid using reusable ProductCard.tsx, Why Parents Choose benefits grid, and testimonials. Verified via production build, linter warnings fix, and master checklist pass.`

- [x] **TSK-008: Shop Catalog with Dynamic Filtering & Search**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `nextjs-react-expert`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-007`
  - **INPUT**: `src/app/shop/page.tsx`
  - **OUTPUT**: `src/app/shop/page.tsx`, `src/components/ProductCard.tsx`
    - Display product cards in a responsive grid.
    - Build a sidebar with filtering: Price range slider, Age-group multi-select, and search input.
    - Highlight navigation across flat categories (All, Educational Toys, School Supplies, Parenting Resources).
  - **VERIFY**: `Completed. Built SSR page fetching products and categories in parallel for SEO. Implemented client-side filtering via useMemo in ShopCatalogClient supporting instant search, price ranges, age groups, and sorting options. Integrated Next.js useSearchParams for URL sync on load and window.history.replaceState for silent URL updates. Responsive design features 2-column mobile card grid, "Search and Filter" bottom action bar triggering a half-screen bottom sheet with "See Result" confirm button, and sticky desktop left sidebar. Verified compile, lint, and master checklist audits passing cleanly.`

- [x] **TSK-009: Product Details view & Image Carousel**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-008`
  - **INPUT**: `src/app/product/[slug]/page.tsx`
  - **OUTPUT**: `src/app/product/[slug]/page.tsx`
    - Design details layout with image carousel.
    - List features: age group tags, stock status, educational benefits bullet points.
    - Add CTA buttons: "Add to Cart" and "Add to Wishlist".
    - Display related products section.
  - **VERIFY**: `Completed. Built Server Component performing data fetching by slug, generating SEO metadata, handling notFound() state, and querying related products with featured padding. Built ProductDetailsClient component featuring Framer Motion carousel with swipe and click navigation, stock status badges, educational benefits check list parser, quantity selector, Zustand cart/wishlist sync, and direct WhatsApp order prefill message link. Updated ProductCard links to use canonical /product/[slug] path. Verified typescript compilation, linting, and checklist audits passing cleanly.`

---

### Phase 4: Dynamic Checkout & Local Payment Workflow
Custom shipping calculations, hybrid payment logic, and WhatsApp prefill integration.

- [x] **TSK-010: Form Setup & Instant Delivery Logic**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `clean-code`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-005`
  - **INPUT**: `src/store/useCartStore.ts`
  - **OUTPUT**: `src/app/checkout/page.tsx`, `src/lib/validation.ts`
    - Create Zod shipping details schema (enforce phone number format, district, and area).
    - Embed District select dropdown and Area select dropdown.
    - Implement instant calculation logic: If District matches `Chattogram` and Area exists in `chattagongCityAreas` list, `deliveryCharge = 60 BDT`, else `120 BDT`.
    - Update delivery fee instantly in the Order Summary when dropdown selections change.
  - **VERIFY**: `Completed. Defined Zod checkout validation schema in src/lib/validation.ts. Formulated /checkout page utilizing nextDynamic with ssr: false to avoid server/client hydration mismatches. Integrated React Hook Form and useWatch to watch district and area changes without React Compiler limitations. Implemented delivery charge calculations yielding ৳60 BDT for Chattogram City, ৳120 BDT for Chattogram Upazilas (via other area input) or other districts, and ৳0 BDT for unselected states. Cleaned up all unused imports and variables, ensuring TypeScript checks, eslint rules, and master checklist scans pass cleanly.`

- [x] **TSK-011: Hybrid Payment & manual verification UI**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-010`
  - **INPUT**: `src/app/checkout/page.tsx`
  - **OUTPUT**: `src/app/checkout/page.tsx`
    - Add checkout selection buttons for:
      - Option 1: Delivery Charge Advance + COD (Paid Now = Delivery fee, Due on Delivery = Subtotal).
      - Option 2: Full Advance Payment (Paid Now = Subtotal + Delivery fee, Due on Delivery = 0).
    - Render Payment Instructions Card displaying personal numbers (bKash/Nagad) and send-money steps.
    - Append form fields for: Payment Method (bKash/Nagad), Sender Mobile Number, Transaction ID (verify format).
  - **VERIFY**: `Completed. Expanded checkout validation schema in src/lib/validation.ts to require paymentOption, paymentMethod, senderNumber, and transactionId. Implemented interactive radio option cards for split-payment plans (Advance + COD vs Full Payment), rendering dynamic cost distributions for Paid Now and Due on Delivery splits. Integrated manual payment instructions details for bKash/Nagad transfers on Personal Number 01825462039 with copy trigger. Configured payment proof verification input fields (Payment Method toggle, Sender Mobile Number, and Transaction ID) with form-validation support. Ensured full responsive layouts, touch targets >= 48px, and Purple Ban styling guidelines are met. Checked type compiles, eslint warnings, and master checklist audits passing cleanly.`

- [x] **TSK-012: Order Submission Action & WhatsApp Integration**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-011`
  - **INPUT**: `src/app/checkout/page.tsx`
  - **OUTPUT**: `src/app/checkout/page.tsx`, `src/app/actions/order.ts`
    - Build Next.js Server Action to insert orders into PostgreSQL via Prisma.
    - Generate unique transaction verification logic to prevent duplicates.
    - Implement a floating/prominent WhatsApp Support button prefilled with the completed form state (Name, Phone, Order Total, Payment Method, Transaction ID) using `wa.me` API.
  - **VERIFY**: `Completed. Developed Next.js Server Action order.ts for order insertions using safe schema parsing. Runs order creation inside a database interactive transaction to atomically check and decrement product stock levels. Intercepts database unique constraint codes to prevent duplicate Transaction ID uploads, translating database throws into custom UI validation warnings. Built form pending controls disabling input selections and returning validation error alerts. Integrates post-checkout Success Screen displaying order metadata card and pre-filled WhatsApp fast-track verification CTA. All linting, compiler types, and master checks passed.`

- [x] **TSK-013: Success/Failure Post-Checkout Landing Screens**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-012`
  - **INPUT**: `src/app/actions/order.ts`
  - **OUTPUT**: `src/app/order-status/[id]/page.tsx`
    - Build high-trust status pages.
    - Success (verified / pending): Show Order ID, items breakdown, payment details, and dynamic instructions.
    - Failure / Rejected: Display details of rejected status with instructions on how to retry or contact support.
  - **VERIFY**: `Completed. Built dynamic server-side page at /order-status/[id] mapping pending, verified, and rejected UI states. Designed client component OrderStatusView.tsx using Framer Motion animations. Included copy buttons for wallet number and order ID with dynamic feedback, dynamic WhatsApp CTA verification payload, and parsed order items breakdown card. Passed typescript compilation, eslint linting, and checklist.py validations.`

---

### Phase 5: Admin Dashboard & Order Verification Panel
Back-office order grid, sales analytics, and order mutations.

- [x] **TSK-014: Admin Analytics & Metrics Dashboard**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `nextjs-react-expert`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-004`
  - **INPUT**: `src/lib/db.ts`
  - **OUTPUT**: `src/app/admin/page.tsx`
    - Design a high-fidelity analytics panel accessible only by `ADMIN` users.
    - Display KPI cards: Total Sales (BDT), Active Orders, Total Registered Customers, and graphical charts for revenue stats.
  - **VERIFY**: `Completed. Built secure layouts restricting access to ADMIN users via NextAuth getServerSession. Designed an asymmetric high-contrast Swiss-geometric layout at /admin displaying KPI Cards for BDT Sales, Active Orders count, and Registered Customers. Created a custom, responsive, lightweight 30-day SVG revenue chart, dynamic Category Sales Mix meters, and a recent store activity ledger table. All typescript, lint, security, schema, and layout checks are 100% passing.`


- [x] **TSK-015: Interactive Orders Data Grid & Search Filters**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`, `database-design`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-014`
  - **INPUT**: `src/app/admin/page.tsx`
  - **OUTPUT**: `src/app/admin/orders/page.tsx`
    - Display all orders in a paginated list layout.
    - Implement real-time filters: Verification Status (`pending`, `verified`, `rejected`) and Order Status.
    - Implement text search by Customer Name, Phone Number, or Transaction ID.
  - **VERIFY**: `Completed. Created Server Action admin-orders.ts to handle paginated queries with text search and status filters. Implemented server-side wrapper in orders/page.tsx and a Crisp Tech Ledger styled OrdersGridView.tsx view. Includes a 250ms debounced search bar, category status filter dropdowns, and an advanced Order Details Lookup Modal displaying shipping address, payment proof variables, and full cart items. Passed npx tsc, eslint linting, and checklist audits.`


- [x] **TSK-016: Order Status Mutations (Server Actions)**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-015`
  - **INPUT**: `src/app/admin/orders/page.tsx`
  - **OUTPUT**: `src/app/admin/orders/page.tsx`, `src/app/actions/admin-orders.ts`
    - Write action mutations to Verify/Reject manual payments.
      - Verification triggers `verificationStatus: verified` and `orderStatus: confirmed`.
      - Rejection triggers `verificationStatus: rejected` and `orderStatus: pending_verification`.
    - Provide status progression trigger: Processing -> Shipped -> Delivered -> Cancelled.
  - **VERIFY**: `Completed. Implemented secure server actions in admin-orders.ts for verification, rejection (with custom notes), and order status updates. Integrated verification/rejection panel and order status progress selectors into OrdersGridView details modal. Transition states are managed using useTransition, with page data refreshed instantly using router.refresh(). All code typechecks, lints, and passes checklist validations.`

- [x] **TSK-017a: Dynamic RBAC & Audit Trail**
  - **Agent**: `backend-specialist`
  - **Skills**: `nodejs-best-practices`, `database-design`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-004`, `TSK-016`
  - **INPUT**: `prisma/schema.prisma`, `src/lib/auth.ts`
  - **OUTPUT**: `prisma/schema.prisma`, `src/types/next-auth.d.ts`, `src/lib/auth.ts`, `src/lib/auth-utils.ts`, `src/app/actions/audit-log.ts`, `src/app/actions/admin-orders.ts`
    - Update `Role` enum to support `SUPER_ADMIN`, `SUB_ADMIN`, and `CUSTOMER`.
    - Add `permissions` (String[]) and `isActive` (Boolean) fields to the `User` model in `schema.prisma`. Ensure permissions maps to `['VIEW_DASHBOARD', 'MANAGE_ORDERS', 'MANAGE_CATEGORIES', 'MANAGE_PRODUCTS', 'MANAGE_FINANCE']`.
    - Create type declaration file `src/types/next-auth.d.ts` to extend session/user fields with `role` and `permissions`.
    - Update NextAuth callbacks in `src/lib/auth.ts` to inject role and permissions into session objects, and reject login if `isActive` is false.
    - Build a server authorization utility `src/lib/auth-utils.ts` to check required permissions (specifically matching the new granular keys: `VIEW_DASHBOARD`, `MANAGE_ORDERS`, `MANAGE_CATEGORIES`, `MANAGE_PRODUCTS`, `MANAGE_FINANCE`) for active sessions.
    - Create `AuditLog` model containing `adminEmail` and `adminRole` (Role enum) fields.
    - Build `logAdminAction` and instrument order mutations in `admin-orders.ts` to securely log active admin identities, checking for `MANAGE_ORDERS` and logging mutations.
  - **VERIFY**: `Check that database pushes succeed, NextAuth sessions contain correct role and permissions payload, and all order status transitions log audit entries with correct admin roles.`

- [x] **TSK-017b: Staff, Access Management & Route Protection**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `clean-code`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-017a`
  - **INPUT**: `prisma/schema.prisma`, `src/app/actions/audit-log.ts`
  - **OUTPUT**: `src/app/admin/staff/page.tsx`, `src/app/actions/admin-staff.ts`, `src/app/admin/staff/StaffManagementClient.tsx`, `src/app/admin/layout.tsx`
    - Design a staff management portal at `/admin/staff` restricted strictly to users with `SUPER_ADMIN` role.
    - Implement Server Actions in `admin-staff.ts` to support adding new sub admins, updating access permissions, and suspending or deleting accounts.
    - Update the permissions modal form in `src/app/admin/staff/StaffManagementClient.tsx` to display distinct checkboxes/toggles for all 5 new granular permissions: `VIEW_DASHBOARD`, `MANAGE_ORDERS`, `MANAGE_CATEGORIES`, `MANAGE_PRODUCTS`, and `MANAGE_FINANCE`.
    - Implement conditional rendering in the Admin Sidebar layout (`src/app/admin/layout.tsx`): dynamically hide/show links depending on the Sub-Admin's active permissions (`VIEW_DASHBOARD` controls Dashboard, `MANAGE_ORDERS` controls Orders, `MANAGE_CATEGORIES` controls Categories, `MANAGE_PRODUCTS` controls Products, `MANAGE_FINANCE` controls Finance). Super Admins bypass all checks.
    - Implement strict page-level route checks in `src/app/admin/layout.tsx` and admin routes. If a Sub-Admin logs in without `VIEW_DASHBOARD` access, automatically redirect them to the first route they *do* have access to (e.g. `/admin/orders` if they have `MANAGE_ORDERS`), or show an "Unauthorized" view if they have zero permissions.
  - **VERIFY**: `Log in as a Super Admin, add a new Sub Admin, toggle their permissions, verify the database values updates. Log in as a Sub Admin with limited permissions, verify only their allowed sidebar links appear, and verify attempting to access restricted routes triggers the correct redirect or unauthorized layout.`

- [x] **TSK-017c: Cloudinary Integration & Upload Component**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `clean-code`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-001`
  - **INPUT**: `package.json`
  - **OUTPUT**: `src/components/ImageUpload.tsx`
    - Install the `next-cloudinary` library package.
    - Create a reusable client-side component `src/components/ImageUpload.tsx` using `CldUploadWidget` from Next-Cloudinary.
    - Component must accept an `onChange` callback prop to communicate the uploaded asset's secure URL string back to the parent component/form.
    - Display a premium dropzone preview area showing the uploaded image thumbnail or an upload trigger button, keeping layout touch targets >= 48px and compliant with the Purple Ban (using slate, blues, and emerald tones).
  - **VERIFY**: `Confirm that the next-cloudinary package builds correctly and the ImageUpload component compiles cleanly without type errors.`

- [x] **TSK-018: Category Management Interface**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `api-patterns`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-014`, `TSK-017c`
  - **INPUT**: `prisma/schema.prisma`, `src/app/admin/page.tsx`, `src/components/ImageUpload.tsx`
  - **OUTPUT**: `src/app/admin/categories/page.tsx`, `src/app/actions/admin-categories.ts`
    - Ensure the `Category` schema supports fields: `id`, `name`, `slug`, `image` (URL/upload path), `text` (description text), and timestamps. Run prisma migration if needed.
    - Implement full CRUD Server Actions (`createCategory`, `updateCategory`, `deleteCategory`) with input validation. Enforce the `MANAGE_CATEGORIES` permission on both the page rendering and the Server Actions.
    - Design a responsive Category CRUD data grid interface under `/admin/categories` with modals/forms to add, edit, or delete categories. Enforce frontend UI checks showing or hiding mutation buttons based on permission scope.
    - **Cloudinary Image Upload Integration**: Force the Category creation/edit forms to use the reusable `ImageUpload` component. Database mutations (`createCategory` and `updateCategory`) must strictly expect and store a `String` representing the Cloudinary secure URL for the `image` field (no local files or Base64).
  - **VERIFY**: `Completed. Added text field to Category model in Prisma schema, synchronized with Neon DB using prisma db push, and updated the seed script. Created secure, validated CRUD Server Actions in admin-categories.ts protected by verifySessionAndPermissions. Built Categories Page route page.tsx with strict role-level guards and CategoryManagementClient.tsx client view with a debounced search filter, add/edit/delete modals, and slug auto-generation. Fully compliant with Purple Ban and touch target sizes. Passed ESLint typechecks and master checklist validation.`

- [ ] **TSK-019: Product Inventory Management**
  - **Agent**: `backend-specialist`
  - **Skills**: `nodejs-best-practices`, `frontend-design`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-018`, `TSK-017c`
  - **INPUT**: `prisma/schema.prisma`, `src/components/ImageUpload.tsx`
  - **OUTPUT**: `src/app/admin/products/page.tsx`, `src/app/actions/admin-products.ts`
    - Build a Product inventory management dashboard at `/admin/products` listing all educational toys.
    - Implement CRUD Server Actions to manage `Product` records, editing fields: `title`, `description`, `price`, `categoryId`, `ageGroup`, `stock`, `benefits` (bullet points), and `featured` status. Enforce the `MANAGE_PRODUCTS` permission on both the page rendering and the Server Actions.
    - **Cloudinary Image Upload Integration**: Integrate the `ImageUpload` component into the Product form to support uploading multiple images. Construct a list of secure Cloudinary URL strings and store them in the database `images` field as a JSONB array.
  - **VERIFY**: `Create a new product, upload multiple images, check JSONB array storage in database, and verify price/stock updates reflect dynamically in the catalog grid. Verify that Sub-Admins without MANAGE_PRODUCTS are blocked from accessing the page and executing actions. Verify that the product images array contains valid Cloudinary URLs.`

- [ ] **TSK-020: Omnichannel Order Creation**
  - **Agent**: `backend-specialist`
  - **Skills**: `api-patterns`, `database-design`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-019`
  - **INPUT**: `prisma/schema.prisma`, `src/app/actions/order.ts`
  - **OUTPUT**: `src/app/admin/orders/create/page.tsx`, `src/app/actions/admin-create-order.ts`
    - Build a manual checkout/order creation form under `/admin/orders/create` to handle manual or social media sales. Enforce the `MANAGE_ORDERS` permission both on the page rendering and the Server Actions.
    - Support fields for customer billing details (Name, Phone, optional Email, Full Address).
    - Build a searchable product selection dropdown to add multiple items from the database catalog and input quantities.
    - Add input fields for custom discounts, manual shipping adjustments, and pricing overrides.
    - Include a `salesChannel` dropdown tag field containing options: `Facebook`, `Instagram`, `Direct`.
  - **VERIFY**: `Submit a manual order, confirm it computes subtotal/totals correctly, decrements stock levels, and sets the salesChannel tag correctly in the database. Verify that users without MANAGE_ORDERS cannot access or submit.`

---

### Phase 6: Omnichannel Sales & Financial Ledger
Point of Sale logging, ledger schemas, and financial KPI calculators.

- [ ] **TSK-021: Sell Dashboard (Direct POS)**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `clean-code`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-020`
  - **INPUT**: `prisma/schema.prisma`
  - **OUTPUT**: `src/app/admin/pos/page.tsx`, `src/app/actions/pos-sales.ts`, `prisma/schema.prisma`
    - Define a new `DirectSale` data model in `schema.prisma` with fields: `id`, `date` (DateTime), `product` (String/Product reference), `quantity` (Int), `price` (Float), `receivedBy` (String), `comment` (String), and timestamps.
    - Build a lightweight Point of Sale (POS) ledger interface under `/admin/pos` using a data grid layout. Enforce the `MANAGE_ORDERS` permission both on the page rendering and the Server Actions.
    - Provide inline editing/creation controls for the data grid to support adding, updating, and deleting sales entries with instant validation.
  - **VERIFY**: `Confirm POS direct sales update rows instantly, persist in the database, and correctly reflect in stock inventories. Verify that users without MANAGE_ORDERS cannot access or modify POS data.`

- [ ] **TSK-022: Financial Accounting Module (Backend)**
  - **Agent**: `database-architect`
  - **Skills**: `database-design`, `api-patterns`
  - **Priority**: `P1`
  - **Dependencies**: `TSK-002`
  - **INPUT**: `prisma/schema.prisma`
  - **OUTPUT**: `prisma/schema.prisma`, `src/app/actions/finance.ts`
    - Add financial models to `schema.prisma`:
      - `Investment`: `id`, `date` (DateTime), `person` (String), `amount` (Float), `comment` (String), timestamps.
      - `Expense`: `id`, `date` (DateTime), `paidBy` (String), `amount` (Float), `invoiceUrl` (String?), `comment` (String), timestamps.
    - Create a server-side financial aggregator utility in `src/app/actions/finance.ts` containing functions to dynamically calculate financial metrics. Enforce the `MANAGE_FINANCE` permission in all exported Server Actions.
      - `Total Invest`: Sum of all `Investment` amounts.
      - `Total Expense`: Sum of all `Expense` amounts.
      - `Total Sell`: Sum of all `amountPaid` from `Order` plus `DirectSale` totals.
      - `In Hand`: Computed as `(Total Invest + Total Sell) - Total Expense`.
  - **VERIFY**: `Verify computed aggregations return exact calculations when compared to manual database entries. Verify that actions throw authorization errors if executed by users without MANAGE_FINANCE.`

- [ ] **TSK-023: Financial Accounting Module (Frontend)**
  - **Agent**: `frontend-specialist`
  - **Skills**: `frontend-design`, `nextjs-react-expert`
  - **Priority**: `P2`
  - **Dependencies**: `TSK-022`
  - **INPUT**: `src/app/actions/finance.ts`, `src/lib/upload.ts`
  - **OUTPUT**: `src/app/admin/finance/page.tsx`
    - Design a clean "Finance" dashboard UI at `/admin/finance`. Enforce the `MANAGE_FINANCE` permission on both the page rendering and the Server Actions.
    - Create top-row KPI cards displaying dynamic metrics: Total Invest, Total Expense, Total Sell, and In Hand.
    - Create a tabbed panel interface containing separate data grids for Investments list and Expenses list.
    - Build transaction log forms for recording new Investments and Expenses, with an upload zone for Expense invoice URLs using `uploadMedia`.
  - **VERIFY**: `Submit new investments and expenses, verify KPI cards update dynamically, and ensure uploaded invoice file URLs can be opened. Verify that users without MANAGE_FINANCE are blocked.`

---

### Phase 7: System Verification & Polish
Linting, E2E testing, and UX audits.

- [ ] **TSK-024: SEO Optimization & Metadata Integration**
  - **Agent**: `seo-specialist`
  - **Skills**: `seo-fundamentals`
  - **Priority**: `P3`
  - **Dependencies**: `TSK-009`
  - **INPUT**: `src/app/layout.tsx`
  - **OUTPUT**: `src/app/layout.tsx`, `src/app/shop/page.tsx`
    - Implement Open Graph and Twitter Card tags.
    - Set up descriptive title tags and meta descriptions for pages.
    - Ensure a single `<h1>` heading layout exists on each page.
  - **VERIFY**: `Check meta-tag presence and verify search engines correctly resolve route metadata.`

- [ ] **TSK-025: Checklist & Master Validations**
  - **Agent**: `performance-optimizer`
  - **Skills**: `performance-profiling`, `webapp-testing`
  - **Priority**: `P3`
  - **Dependencies**: `All prior tasks`
  - **INPUT**: `All codebase files`
  - **OUTPUT**: `None (reports only)`
    - Execute standard validator commands:
      ```powershell
      python .agents/scripts/checklist.py .
      ```
    - Check accessibility contrast ratios, touch target margins, and confirm the absolute ban of purple/violet hex codes has been strictly followed.
  - **VERIFY**: `Ensure checklist.py script passes with zero errors on the final workspace codebase.`

---


## 🏁 Phase X: Final Validation Checklist
Before launching deployment or completing the project workspace, verify the list of compliance criteria:
- [ ] No purple or violet color definitions inside styles (e.g. classes matching `purple`, `violet`, `indigo` or custom hex values).
- [ ] Clean build via `npm run build` without typescript compiler errors.
- [ ] Zod schema verification for transaction IDs and phone format inputs.
- [ ] Instant delivery calculations tested for Chittagong City Areas (60 BDT) vs Others (120 BDT).
- [ ] WhatsApp message payload links successfully format shipping data.
