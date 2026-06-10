# TSK-016: Order Status Mutations (Server Actions)

## Goal
Build server-side mutations to verify, reject, or progress order statuses, and integrate the control triggers directly into the Admin Orders Grid details modal.

## Tasks
- [ ] **Task 1: Server Action Mutations (`src/app/actions/admin-orders.ts`)**
  - **Action**: Add three secure server actions inside the admin orders actions file:
    1. `verifyOrderPayment(orderId)`: Updates order record to `verificationStatus = 'verified'` and `orderStatus = 'confirmed'`.
    2. `rejectOrderPayment(orderId, notes)`: Updates order record to `verificationStatus = 'rejected'`, `orderStatus = 'pending_verification'`, and sets `adminNotes = notes`.
    3. `updateOrderStatus(orderId, status)`: Validates status enum transitions and updates the `orderStatus` (e.g. processing, shipped, delivered, cancelled).
    - Ensure all three actions perform server-side admin role checks (`getServerSession`).
  - **Verify**: Compile checks (`npx tsc --noEmit`) to verify typed Prisma update inputs.

- [ ] **Task 2: Interactive Verification Widgets inside Modal (`src/app/admin/orders/OrdersGridView.tsx`)**
  - **Action**: Add an "Admin Operations" panel in the Details Modal.
    - If verification status is `pending`, display:
      - **Verify Payment** (emerald green button, >=48px touch height).
      - **Reject Payment** (opens a sub-form input field to write rejection reasons and a red confirm button).
  - **Verify**: Inspect modal rendering, checking that buttons only display for pending orders.

- [ ] **Task 3: Order Status Progression Select Component**
  - **Action**: For verified orders, display a dropdown select input or button controls to progress order states: `Confirmed -> Processing -> Shipped -> Delivered` and `Cancelled`. Disable options that break sequential flows where necessary.
  - **Verify**: Change status, confirm select components show correct options based on active state.

- [ ] **Task 4: Dynamic Page Refresh & Loading States**
  - **Action**: Bind verification buttons and status selectors to transition states using React's `useTransition` or local loading state spinners. Upon successful completion, call Next.js `router.refresh()` to fetch the updated database grid values.
  - **Verify**: Complete verification and check that the background grid updates instantly without requiring browser reloads.

- [ ] **Task 5: Compliance Audits**
  - **Action**: Verify there are no unused imports, strict compliance with the Purple Ban, and run checklist.
  - **Verify**: Run `python -X utf8 .agents/scripts/checklist.py .` to ensure 100% checklist compliance.

## Notes
- **Styling**: Complies fully with the **Purple Ban** (absolutely no purple, violet, or indigo class names or color hex codes).
- **Touch Targets**: Actions and forms in the admin modal must satisfy the $\ge 48\text{px}$ touch target sizes.
