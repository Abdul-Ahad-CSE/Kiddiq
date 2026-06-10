# TSK-014: Admin Analytics & Metrics Dashboard

## Goal
Build a high-fidelity, secure, and responsive administration overview dashboard at `/admin` featuring key business metrics (KPIs) and custom SVG charts.

## Tasks
- [ ] **Task 1: Secure Admin Layout Wrapper (`src/app/admin/layout.tsx`)**
  - **Action**: Create the admin layout route. Fetch the NextAuth session server-side. If unauthorized or non-ADMIN role, redirect to `/login` or `/` immediately. Otherwise, render the admin navigation shell with a clean sidebar.
  - **Verify**: Log in as a customer and attempt to visit `/admin` (should redirect to home). Log in as admin and verify the dashboard layout loads successfully.

- [ ] **Task 2: Database Analytics Server Action (`src/app/actions/admin-metrics.ts`)**
  - **Action**: Implement a server action using Prisma to query:
    1. **Total Sales**: Sum of `subtotal + deliveryCharge` (minus discounts) for all orders where `verificationStatus = 'verified'`.
    2. **Active Orders**: Count of orders with `orderStatus` not in `['delivered', 'cancelled']`.
    3. **Total Customers**: Count of users with `role = 'CUSTOMER'`.
    4. **Sales History**: Query the last 30 days of sales grouped by day for the revenue trend chart.
  - **Verify**: Run a typescript compilation test (`npx tsc --noEmit`) to confirm query result typings.

- [ ] **Task 3: Dashboard Hero KPI Cards UI (`src/app/admin/page.tsx`)**
  - **Action**: Design KPI cards for the computed statistics. Style with warm amber/yellow, slate, and emerald borders/text. Ensure touch targets are >=48px for layout navigation. Apply Outfit font and Lucide Icons.
  - **Verify**: Inspect layouts on both mobile and desktop viewports, verifying grid responsiveness.

- [ ] **Task 4: SVG Daily Revenue Trend Chart**
  - **Action**: Draw an interactive, lightweight SVG bar/line chart representing daily revenue over the last 30 days. Avoid external graphing libraries to minimize chunk size.
  - **Verify**: Confirm the SVG chart renders fluidly, scales correctly across mobile screens, and doesn't trigger layout shifting.

- [ ] **Task 5: Category & Sales Channel Distribution Meters**
  - **Action**: Build horizontal percentage meters using Tailwind CSS to display product category mix (Toys, School, Parenting) and order source statistics (Web vs. Social channels if present).
  - **Verify**: Confirm percentage indicators aggregate to exactly 100% and conform to the Purple Ban styling rules.

- [ ] **Task 6: Verification and Master Audits**
  - **Action**: Run lint runner and security audits via the toolkit scripts.
  - **Verify**: Run `python -X utf8 .agents/scripts/checklist.py .` and ensure all checks pass with zero warnings.

## Notes
- **Styling**: Complies fully with the **Purple Ban** (absolutely no purple, violet, or indigo class names or custom hex codes).
- **Session Safety**: Performs direct NextAuth role checks server-side inside `layout.tsx` to prevent private page hydration leaks.
