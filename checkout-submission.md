# [Goal Description]
Implement the backend order submission handler and WhatsApp fast-track fulfillment integration. 
This covers writing a Next.js Server Action to insert orders into PostgreSQL via Prisma, execute atomic inventory stock deductions, prevent duplicate transaction uploads, and construct pre-filled WhatsApp message redirect targets.

## User Review Required
- **Stock Depletion Action**: Prisma transactions will roll back automatically if any product stock level falls below the requested quantity, reporting a descriptive error back to the customer.
- **WhatsApp Support Target**: Prefilled template messages will target the Personal phone number `01825462039`.

## Open Questions
Please refer to the detailed implementation plan in the workspace artifact directory: [implementation_plan.md](file:///C:/Users/ABDUL%20AHAD/.gemini/antigravity/brain/4138fc47-26c2-4d57-92ec-ddb2756fb6bd/implementation_plan.md) for full Socratic Questions regarding:
- Concurrent Stock Deduction Isolation
- Duplicate Transaction ID Rejection
- WhatsApp Redirect Trigger Timing

## Proposed Changes

### Checkout Component & Order Action

#### [NEW] [order.ts](file:///f:/Level_2/Kiddiq/src/app/actions/order.ts)
- Define `createOrder` Server Action.
- Verify checkout inputs via `checkoutSchema.parse()`.
- Run validation checks on product stock limits.
- Update database atomic records inside a Prisma `$transaction` block:
  - Deduct stock levels per line item.
  - Insert order records including customer data, cost splits, and manual payment fields.
- Map unique key violation codes to return descriptive validation errors (e.g., duplicate `transactionId` error).

#### [MODIFY] [CheckoutClient.tsx](file:///f:/Level_2/Kiddiq/src/app/checkout/CheckoutClient.tsx)
- Connect form submission handler `onSubmit` to the `createOrder` Server Action.
- Display loading indicators and disable submission inputs during async request periods.
- Render server error message banner if backend validation fails.
- Clear local cart storage (`clearCart()`) and redirect to dynamic order status page `/order-status/[id]` upon order success.

## Verification Plan

### Automated Tests
- TypeScript check: `npx tsc --noEmit`
- ESLint syntax validation: `npm run lint`
- Master audit check: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
- Verify checkout errors block invalid forms.
- Verify inventory deductions update successfully in PostgreSQL database.
- Verify cart clears and correctly redirects on successful checkout completion.
- Verify duplicate transaction ID submissions trigger proper error feedback.
