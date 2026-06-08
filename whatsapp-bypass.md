# Implementation Plan: WhatsApp Checkout Bypass Option (TSK-012c)

## Goal
Implement a direct "WhatsApp Checkout Bypass" secondary CTA button on the checkout page `/checkout` directly below the primary submit button. This allows users to complete their orders via direct messaging with the support admin without filling out the shipping form.

## Proposed Changes

### Frontend Layout

#### [MODIFY] [CheckoutClient.tsx](file:///f:/Level_2/Kiddiq/src/app/checkout/CheckoutClient.tsx)
- Calculate the `whatsappBypassUrl` using `useMemo` based on `cartItems`, `subtotal`, and `discount`.
- Inject the secondary WhatsApp Checkout Bypass link `<a>` directly underneath the primary submit button.
- Apply styling matching the color palette (avoiding purple/violet) and accessibility touch targets (>=44px).

## Verification Plan

### Automated Checks
- TypeScript compilation: `npx tsc --noEmit`
- ESLint checks: `npm run lint`
- Master audit check: `python -X utf8 .agents/scripts/checklist.py .`
