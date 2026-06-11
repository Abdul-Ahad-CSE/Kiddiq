# Plan: TSK-020: Omnichannel Order Creation

## Goal
Build a dedicated Admin Order Creation interface that allows administrators (Super Admins and Sub Admins) to manually place orders from various channels (such as Facebook, WhatsApp, POS/Walk-in, and Phone) directly within the admin dashboard.

---

## User Review Required & Open Questions

Please review the following strategic decision points. Your input will shape the database integration and user flow:

### P0 **PAYMENT METHODS & DATABASE COMPLIANCE**
**Question**: How should we represent POS/Cash/Card payments in the database?
- The current Prisma schema has a non-optional `paymentMethod` string (e.g., "bKash", "Nagad") and `paymentOption` ("COD", "FULL_ADVANCE").
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Extend Schema** | Clean data modeling. | Requires database schema migration. | Long-term robustness. |
  | **B: Storefront Defaults** | No migration needed. Map new methods (e.g., "Cash", "Card") directly to `paymentMethod` and set `paymentOption` to "FULL_ADVANCE" or "COD" accordingly. | Data constraints might be slightly hacky. | Quick delivery without DB downtime. |

**If Not Specified**: We will proceed with **Option B** (reusing the existing schema columns and saving `"Cash"` or `"Card"` directly to `paymentMethod`).

---

### P0 **TRANSACTION ID GENERATION**
**Question**: How should we generate transaction IDs for manual cash/card/social-media orders?
- The current schema requires a unique `transactionId` string.
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Auto-Generate** | Seamless flow for admins. Generates e.g., `OMNI-POS-XXXXXXXX` using timestamps. | Can lead to collisions if not randomized enough. | General manual checkout. |
  | **B: Optional Manual Override** | Admins can enter actual bank/POS receipt reference numbers. | Extra field validation required. | High accuracy accounting. |

**If Not Specified**: We will auto-generate unique IDs (e.g., `OMNI-Facebook-[timestamp]`) by default, while providing an optional input for manual reference receipt IDs.

---

### P1 **PRODUCT SELECTION & STOCK RESERVATION**
**Question**: How should products be selected and added to the order?
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Searchable Catalog List** | Direct dropdown list search of existing products. Automatically deducts stock. | More frontend setup. | Normal inventory integrity. |
  | **B: Plain Text Input** | Simple description and price inputs. | No inventory deduction or product matching. | Unlisted custom sales. |

**If Not Specified**: We will build a searchable catalog selection dropdown where admins choose from live products, which validates and decrements stock.

---

## Proposed Changes

### Component 1: Admin Order Creation Actions
#### [NEW] [admin-orders.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-orders.ts) (or update existing)
- Create a `createOmnichannelOrder` server action:
  - Protect via RBAC (`verifySessionAndPermissions(["MANAGE_ORDERS"])`).
  - Validate customer info, shipping addresses, selected items, and quantities.
  - Automatically calculate subtotal, lookup and apply shipping zone charges, and calculate dues.
  - Decrement stock of purchased products.
  - Create the `Order` record and log an `AuditLog` entry.

### Component 2: Admin Dashboard Page & UI Form
#### [NEW] [page.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/orders/create/page.tsx)
- Expose a clean, responsive layout at `/admin/orders/create` styled in accordance with the **Purple Ban** (slate, brand blue, emerald accents).
- Render forms for Customer Info, Shipping/Delivery details, Product Items grid list, and Payment methods.
- Enforce $\ge 44\text{px}$ touch target sizes on all select widgets, inputs, and submission buttons.

---

## Verification Plan

### Automated Checks
- Run type safety compile audit: `npx tsc --noEmit`
- Run lint validation: `npm run lint`

### Manual Verification Steps
1. Log in as an Administrator.
2. Navigate to Order Creation page `/admin/orders/create`.
3. Select "WhatsApp" as the channel, choose "Cash" as payment, search and add a product with quantity 2.
4. Verify subtotal and shipping charges compute dynamically.
5. Save the order and confirm it displays in the Admin Orders Grid.
6. Verify database stock level for the purchased product decremented by 2.
