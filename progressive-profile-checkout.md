# Progressive Profile & Checkout Sync (TSK-024B)

## Goal
Implement checkout progressive profiling (address pre-filling and sync-to-profile option) and a self-service customer profile dashboard.

## Tasks
- [x] Task 1: Update `src/app/checkout/CheckoutClient.tsx` to prefill address fields from session profile details, and add the "Save this address to my profile" checkbox (checked by default) → Verify: When logged in as a customer, checkout address inputs are pre-filled and checkbox is rendered.
- [x] Task 2: Modify `createOrder` action in `src/app/actions/order.ts` to detect the checkbox status and sync shipping details back to the user's DB profile via `prisma.user.update` → Verify: Placing checkout orders with "Save address" checked successfully updates user phone, district, area, and address in database.
- [x] Task 3: Create profile Server Component page `src/app/profile/page.tsx` protected by role checks (rejects non-CUSTOMER roles or unauthenticated requests) → Verify: Guests and admins are restricted; logged-in customers successfully load and render.
- [x] Task 4: Create profile client view component `src/app/profile/ProfileClient.tsx` dividing options into two forms: Profile Details Form (Email read-only/disabled; other fields editable) and Security Password Form (Current, New, Confirm New password fields) → Verify: Ensure inputs have touch targets >= 44px (`h-12`) and obey Purple Ban. Separating forms prevents validation/submission collision.
- [x] Task 5: Implement backend Server Actions in `src/app/actions/customer-profile.ts` for updating details and updating passwords (verifies current hashed password using bcrypt and parses inputs via Zod) → Verify: Incorrect current passwords return validation error alerts, and successful matches correctly hash and save new passwords.
- [x] Task 6: Integrate "My Profile" navigation link into `src/components/Navbar.tsx` visible when user session role is `CUSTOMER` → Verify: Navbar displays link on desktop and mobile menus for customer sessions.
- [x] Task 7: Run compiler, linter, and project verification checklist scripts → Verify: `npx tsc --noEmit`, `npm run lint`, and `python -X utf8 .agents/scripts/checklist.py .` compile successfully.

## Done When
- [x] Customers can checkout with auto-filled fields, save modifications back to their profile, edit details on `/profile` with isolated forms, and change passwords securely.
- [x] All automated type checks, linter checks, and checklist validation tests pass cleanly.

## Notes
- Enforce the Purple Ban strictly (use slates, brand blues, emerald elements, no purple/indigo).
- Enforce Touch Targets of at least 44px on all form buttons and inputs.
