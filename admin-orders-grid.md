# TSK-015: Interactive Orders Data Grid & Search Filters

## Goal
Build a high-fidelity, real-time searchable and filterable admin orders data grid at `/admin/orders` with pagination, dynamic status badges, and mobile responsiveness.

## Tasks
- [x] **Task 1: Server Action for Paginated Orders Query (`src/app/actions/admin-orders.ts`)**
  - **Action**: Implement a server action `getAdminOrders(params)` that accepts optional parameters: `search` (matches customer name, phone, or transaction ID), `verificationStatus` (pending, verified, rejected), `orderStatus` (pending_verification, confirmed, processing, shipped, delivered, cancelled), `page`, and `limit`. Query Prisma dynamically with pagination offsets and return `{ orders, totalCount, totalPages }`.
  - **Verify**: Call the action from a test script or compile check (`npx tsc --noEmit`) to verify paginated schema results.

- [x] **Task 2: Orders Search & Filter Control Bar (`src/app/admin/orders/page.tsx`)**
  - **Action**: Create the admin orders page component. Build a responsive filter bar:
    - Text search input for searching by name, phone, or transaction ID (with a 200ms debounce).
    - Dropdown/button triggers to filter by Verification Status and Order Status.
    - Clear Filters button to reset all parameters.
  - **Verify**: Type in search and confirm values update the filters instantly.

- [x] **Task 3: URL Parameter State Synchronization**
  - **Action**: Map all filter settings (search query, selected statuses, active page) directly to the URL Query Parameters (e.g. `?page=1&search=Ahad&verify=verified`). Use Next.js client router to synchronize states, making filters shareable.
  - **Verify**: Reload the page with query string active and verify filter fields populate with correct state values on load.

- [x] **Task 4: Tabular Data Grid & Mobile Card Layout**
  - **Action**: Design a responsive table.
    - **Desktop**: Tabular grid displaying columns: Order ID (mono), Customer (Name/Phone), Date, Amount, Verification, Status, and Action buttons.
    - **Mobile**: Grid of summary cards containing key details and status badges to prevent horizontal scrolling on small screens.
    - **Pills**: Color-coded status pills (emerald for verified/delivered, amber/orange for pending/processing, red for rejected/cancelled) using safe HSL classes.
  - **Verify**: Test layout responsiveness by resizing viewports down to 320px.

- [x] **Task 5: Quick View Order Details Modal**
  - **Action**: Add an interactive details modal (minimum 48px click targets) that triggers on clicking an order row/card. Display full shipping address, payment method logs, and a listing of the items JSON array showing ordered products and quantities.
  - **Verify**: Click an order, confirm the details modal slides in cleanly and can be dismissed.

- [x] **Task 6: Verification & Master audits**
  - **Action**: Run lint checkers, typescript type compilation, and the verification checklist script.
  - **Verify**: Run `python -X utf8 .agents/scripts/checklist.py .` to ensure 100% compliance.

## Notes
- **Styling**: Complies fully with the **Purple Ban** (absolutely no purple, violet, fuchsia, or indigo class names or custom hex codes).
- **Touch Targets**: All click targets for pagination, filters, and modals must be $\ge 48\text{px}$ to provide proper spacing.

