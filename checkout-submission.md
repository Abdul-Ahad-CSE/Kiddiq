# Architectural & Backend Blueprint: Order Submission Action & WhatsApp Integration (TSK-012)

## Goal
Implement the backend order processing pipeline and the WhatsApp fast-track fulfillment integration. This covers creating a Next.js Server Action to validate checkout form payloads, run atomic database transactions (inserting orders and updating inventory stock levels), handle duplicate transactions gracefully, and construct formatted WhatsApp share URLs.

## Decisions Made
1. **Stock Deduction**: Option A (Atomic Check & Rollback). Use a single Prisma Transaction to check and decrement stock. Roll back and return an error if inventory is insufficient.
2. **Duplicate Transaction ID**: Option A (Strict Rejection). Reject the submission if the transaction ID already exists in the database.
3. **WhatsApp Redirect**: Option A (Success Screen CTA). Do not auto-open new tabs. Generate the WhatsApp payload and render it as a prominent CTA button on the post-checkout success UI.

## Proposed Changes

### Backend & Database Layer

#### [NEW] [order.ts](file:///f:/Level_2/Kiddiq/src/app/actions/order.ts)
- Implement `createOrder` Server Action:
  - Add `"use server"` directive.
  - Parse and validate input data against `checkoutSchema` from `@/lib/validation`.
  - Fetch session from NextAuth to link authenticated user id if logged in.
  - Query DB to verify all cart items exist and have sufficient stock.
  - Run database write inside a Prisma `$transaction`:
    1. Verify stock levels per product. If stock goes below 0, throw custom error to trigger rollback.
    2. Decrement stock for each product.
    3. Calculate total and splits server-side.
    4. Create the `Order` record, saving items as a JSON array.
  - Handle unique constraint errors for `transactionId` and return a user-friendly error response `{ success: false, error: "..." }`.
  - Return `{ success: true, orderId: "..." }` on success.

### Frontend Checkout Interface

#### [MODIFY] [CheckoutClient.tsx](file:///f:/Level_2/Kiddiq/src/app/checkout/CheckoutClient.tsx)
- Modify `onSubmit` function:
  - Transition form status to loading state.
  - Call the `createOrder` server action.
  - If action fails:
    - Display error banner near the top of the form or near submit button.
    - Re-enable submit button.
  - If action succeeds:
    - Clear the local cart storage (`clearCart()`).
    - Render a Success Screen displaying:
      - A confirmation message.
      - A prominent WhatsApp button linking to `wa.me` with the pre-filled encoded order details.

## Verification Plan

### Automated Checks
- TypeScript compilation: `npx tsc --noEmit`
- ESLint checks: `npm run lint`
- Master audit check: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
- Verify checkout errors block invalid forms.
- Verify inventory deductions update successfully in database.
- Verify duplicate transaction ID submissions trigger proper error feedback.
