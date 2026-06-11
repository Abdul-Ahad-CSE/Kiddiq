# Plan: End-to-End Coupon Code & Discount System

## Goal
Implement a complete discount coupon system, including a database model, an admin interface for coupon CRUD management (creation, listing, editing, active toggles), and a dynamic coupon application input during checkout with automated subtotal validation and self-correcting auto-removal behavior.

---

## User Review Required

> [!IMPORTANT]
> **Database Changes Required**: We will add a new `Coupon` model and modify the `Order` model in `schema.prisma`. 
> Adding `couponCode` and `discount` to the `Order` schema is critical to prevent accounting discrepancies between `subtotal + deliveryCharge` and `amountPaid + amountDueOnDelivery`.

---

## Open Questions

> [!WARNING]
> **Discount Type**: The current design implements percentage discounts (e.g. 10% off). Should we support fixed amount discounts (e.g., ৳150 off) in this iteration, or only percentage-based ones?
> *Default recommendation*: Percentage discounts as requested, but structured in a way that is easily extendable.

---

## Proposed Changes

### Component 1: Database Schema

#### [MODIFY] [schema.prisma](file:///f:/Level_2/Kiddiq/prisma/schema.prisma)
* Add `Coupon` model to store code rules:
  ```prisma
  model Coupon {
    id              String   @id @default(uuid())
    code            String   @unique
    discountPercent Float
    minOrderAmount  Float
    isActive        Boolean  @default(true)
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }
  ```
* Update `Order` model to track applied discounts:
  ```prisma
  model Order {
    // ... existing fields
    couponCode          String?
    discount            Float              @default(0)
    // ... existing fields
  }
  ```

---

### Component 2: State Management

#### [MODIFY] [useCartStore.ts](file:///f:/Level_2/Kiddiq/src/store/useCartStore.ts)
* Add `appliedCoupon` state to `CartStore`:
  ```typescript
  export interface CouponState {
    code: string;
    discountPercent: number;
    minOrderAmount: number;
  }
  ```
* Implement `applyCoupon(coupon: CouponState | null) => void` action.
* Introduce an internal helper `checkCouponValidity(items: CartItem[], coupon: CouponState | null): CouponState | null` which returns `null` if the subtotal drops below `minOrderAmount`.
* Update `addItem`, `removeItem`, and `updateQuantity` actions to intercept state updates and auto-clear `appliedCoupon` if it fails validity checks.

---

### Component 3: Server Actions

#### [NEW] [admin-coupons.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-coupons.ts)
* Create CRUD operations for admin coupon management:
  * `createCoupon(data)`: Validates inputs (capitalized unique code, positive discount %, positive min amount), checks code availability, and saves to database.
  * `updateCoupon(id, data)`: Edits description/values.
  * `toggleCouponStatus(id, isActive)`: Enables/disables coupons.
  * `deleteCoupon(id)`: Permanently deletes a coupon.
* Create validation action for checkout:
  * `validateCouponCode(code: string, currentSubtotal: number)`: Checks database for matching coupon. Returns validation errors (not found, inactive, or subtotal below minimum amount) or coupon details.

---

### Component 4: Admin Management UI

#### [NEW] [admin/coupons/page.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/coupons/page.tsx)
* Server page route enforcing `"MANAGE_FINANCE"` or `"SUPER_ADMIN"` role access, fetching all coupons from the database.

#### [NEW] [admin/coupons/CouponManagementClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/coupons/CouponManagementClient.tsx)
* Renders listing table (code, discount %, min order amount, status pill, toggle switch, delete button).
* Add/Edit coupon modal form with strict validations.
* Complies with **Purple Ban** and tap-targets $\ge 48\text{px}$.

---

### Component 5: Checkout Page Integration

#### [MODIFY] [checkout/CheckoutClient.tsx](file:///f:/Level_2/Kiddiq/src/app/checkout/CheckoutClient.tsx) (or target file name)
* Inject Coupon Input Field and "Apply" button inside the Order Summary sidebar.
* Display active coupon details with a "Remove" button.
* Display applied discount row (`-৳XXX`) in the price breakdown list.
* Hook into Zustand store state to react to auto-removals if cart items are adjusted from checkout.

---

## Calculation Flow & Order of Operations

To prevent decimal drift and guarantee accounting consistency:
1. **Subtotal**: Sum of unit prices multiplied by quantities:
   $$\text{Subtotal} = \sum (\text{item.price} \times \text{item.quantity})$$
2. **Min Order Check**: Verify if $\text{Subtotal} \ge \text{minOrderAmount}$. If false, applied discount is set to $0$ and coupon is stripped.
3. **Discount**: Calculate percent of subtotal:
   $$\text{Discount} = \text{Subtotal} \times \left(\frac{\text{discountPercent}}{100}\right)$$
   *Note: Discount applies ONLY to the subtotal (excludes shipping fees).*
4. **Fulfillment**: Calculate shipping charge based on zone selection.
5. **Grand Total**: Combine subtotal, discount, and shipping:
   $$\text{Grand Total} = (\text{Subtotal} - \text{Discount}) + \text{Shipping Charge}$$
6. **COD/Advance**: If Cash-on-Delivery, calculate due amount:
   $$\text{Amount Due} = \text{Grand Total} - \text{Amount Paid (Advance)}$$

---

## Verification Plan

### Automated Tests
- Run database migrations: `npx prisma migrate dev --name add_coupons`
- Type verification: `npx tsc --noEmit`
- Linter audit: `npm run lint`
- Master checklist audit: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
1. **Admin Creation**: Create coupon `KIDDIQ10` (10% off, min order ৳1,500). Verify active state.
2. **Checkout Low Cart**: Add ৳1,000 cart items. Attempt to apply `KIDDIQ10`. Verify validation failure: "Add ৳500 more to use this coupon."
3. **Checkout High Cart**: Add another ৳600 item (subtotal ৳1,600). Apply coupon. Verify ৳160 discount is applied and Grand Total is recalculated.
4. **Auto-Removal Trigger**: Decrease cart quantity to drop subtotal to ৳1,200. Verify coupon is automatically stripped and Grand Total returns to normal.
