# Architectural & UI Plan: Success/Failure Post-Checkout Landing Screens (TSK-013)

## Goal
Implement a dedicated, database-driven post-checkout status screen at `/order-status/[id]`. This page will display real-time verification status, shipment tracking, order breakdown details from database values, and manual payment verification CTAs.

---

## Resolved Socratic Gate Specifications

### 1. Error Handling & Order Not Found State
If a user tries to access `/order-status/[id]` with a non-existent order ID or if a query error occurs:
- Render a dedicated, beautifully stylized **"Order Not Found / System Error"** card using the allowed brand colors (no purple/violet).
- Provide a clear fallback CTA: **"Contact Support via WhatsApp"** (with minimum 44px/48px touch target).
- The `wa.me` redirect URL will contain a dynamic payload:
  `Hi Kiddiq, I am facing an issue while checking my order status. The system is showing this error: [Error Message or 'Order ID Not Found']. Please help me resolve this!`

### 2. UI State Mapping & Syncing
We map database fields `verificationStatus` and `orderStatus` to three distinct UI layouts:

- **State A: Pending Verification UI**
  - **Trigger**: `verificationStatus === 'pending'`
  - **Components**:
    - Animated green/yellow success/pending icon.
    - Order summary card (Order ID, Payment Option, Paid Now, Due on Delivery).
    - Payment proof instructions card containing copyable fields for manual payment transfer (`bKash`/`Nagad` to target number `01825462039`).
    - Dynamic WhatsApp verification CTA that pre-fills order ID and payment proof details.

- **State B: Timeline Success UI**
  - **Trigger**: `verificationStatus === 'verified'` AND `orderStatus !== 'cancelled'`
  - **Components**:
    - Emerald-green progress timeline showing milestones:
      1. **Placed** (Completed upon order creation)
      2. **Verified** (Completed because `verificationStatus === 'verified'`)
      3. **Processing** (Active if `orderStatus` is `processing`, `shipped`, or `delivered`)
      4. **Shipped** (Active if `orderStatus` is `shipped` or `delivered`)
      5. **Delivered** (Active if `orderStatus` is `delivered`)
    - Friendly visual indicator highlighting current status.

- **State C: Rejected / Cancelled UI**
  - **Trigger**: `verificationStatus === 'rejected'` OR `orderStatus === 'cancelled'`
  - **Components**:
    - Rejection alert card in warning red/orange tones.
    - Description box rendering the custom `adminNotes` / rejection reason.
    - Support hotline CTA and direct WhatsApp support button to help resolve issues.

---

## Proposed Changes

### Frontend Routing & Pages

#### [MODIFY] [CheckoutClient.tsx](file:///f:/Level_2/Kiddiq/src/app/checkout/CheckoutClient.tsx)
- Import `useRouter` from `next/navigation`.
- In `onSubmit`, replace `setSubmittedOrder(...)` with `router.push("/order-status/" + res.orderId)`.
- Remove the local state `submittedOrder` and the inline success layout rendering block.

#### [NEW] [page.tsx](file:///f:/Level_2/Kiddiq/src/app/order-status/[id]/page.tsx)
- Create a server-rendered page at `/order-status/[id]/page.tsx` that:
  - Fetches the order record matching the parameter `id` using `prisma.order.findUnique`.
  - Employs strict error boundaries. If the query throws an exception or returns `null`, renders the stylized **"Order Not Found"** component.
  - Validates and passes data to a child client view component (or renders the layout natively with clean, interactive interactive elements).
  - Returns appropriate, descriptive SEO titles and metadata based on the order.

#### [NEW] [OrderStatusView.tsx](file:///f:/Level_2/Kiddiq/src/app/order-status/[id]/OrderStatusView.tsx)
- Create a client interactive component (with `"use client"`) to manage:
  - Copy-to-clipboard actions for transaction details and wallet numbers with dynamic visual feedback (e.g. "Copied!").
  - Entrance animations using `framer-motion` (via `FadeIn` and `StaggerContainer` from `src/components/FramerWrapper`).
  - Strict compliance with the **Purple Ban** (using brand HSL blues, ambers, and emeralds; avoiding any purple/violet/indigo classes).
  - Proper mobile touch sizing of at least 44x44px (with `min-h-[48px]` for buttons).
  - Dynamic WhatsApp messages linking to support or verification targets.
  - **Dynamic Items Breakdown Card**: Lists products from the `items` JSON array, showing name, quantity, unit price, and subtotal.

---

## Verification Plan

### Automated Checks
- Run TypeScript compiler to check for absolute type safety:
  `npx tsc --noEmit`
- Run lint validation checks:
  `npm run lint`
- Run the master validation script:
  `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
1. **Redirect check**: Add items to cart, fill form, checkout, and verify instant redirection to `/order-status/[id]`.
2. **Pending check**: Inspect `/order-status/[id]` to verify the manual payment verification details, copy buttons, and pre-filled WhatsApp link display correctly.
3. **Timeline check**: Set `verificationStatus` to `verified` in DB, verify timeline matches active stages.
4. **Rejection check**: Set `verificationStatus` to `rejected`, verify warning badge and custom `adminNotes` message load correctly.
5. **System Error check**: Navigate to `/order-status/invalid-uuid` and check that the stylized error card and dynamic error WhatsApp support CTA render as intended.
