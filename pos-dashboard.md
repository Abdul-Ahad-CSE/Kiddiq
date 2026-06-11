# Plan: TSK-021: Sell Dashboard (Direct POS)

## Goal
Build a lightweight Point of Sale (POS) ledger interface under `/admin/pos` using a data grid layout with inline controls to record, update, and delete direct walk-in sales. Define a new `DirectSale` database model that synchronizes and adjusts product inventory levels upon mutations.

---

## User Review Required & Open Questions

Please review the following strategic decision points to guide the POS dashboard design:

### P0 **INVENTORY ADJUSTMENTS & MUTATION TRIGGERS**
**Question**: How should product inventory respond to Direct Sale mutations?
- When a POS direct sale is created, updated, or deleted, it has a direct impact on product stock levels.
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Full Inventory Auto-Sync** | Keeps inventory perfectly accurate. Creation decrements stock, deletion restores it, and edits adjust it based on the delta. | Complex transaction checks to prevent negative stock during edits. | Multi-channel storefront integrity. |
  | **B: Ledger-Only Logging** | Simple record-keeping with no automatic stock adjustments. | Product stock will drift, requiring manual audits. | Basic sales logs without inventory synchronization. |

**If Not Specified**: We will implement **Option A** (fully automated Prisma transactions that adjust product stock on creation, edit, and deletion, with checks to prevent negative stock).

---

### P0 **"RECEIVED BY" CAPTURE**
**Question**: Should the `receivedBy` field (tracking the processing cashier/admin) be auto-filled or manually inputted?
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Auto-fill from Session** | Secure, prevents fraud or operator error. Automatically logs the active admin's email. | Cannot record sales on behalf of other staff. | Standard operations. |
  | **B: Cashier Input Select** | Flexible. Lets the operator type their name or select from a staff dropdown. | Open to spelling issues or incorrect entries. | Shared physical terminal. |

**If Not Specified**: We will auto-fill from the logged-in administrator's email, while displaying it read-only on the form.

---

### P1 **INLINE EDITING UI PATTERN**
**Question**: What frontend pattern do you prefer for adding and updating sales records?
- **Options**:
  | Option | Pros | Cons | Best For |
  |--------|------|------|----------|
  | **A: Dialog Modals** | Easy to validate fields, mobile-friendly, fits existing admin dashboard patterns. | Requires opening a popup. | General usability. |
  | **B: Spreadsheet Grid** | Direct double-click cell edits in the table row. | Harder to use on mobile viewports; less space for validation feedback. | Desktop-only power users. |

**If Not Specified**: We will build **Option A** (using standard slide-over drawer or dialog modals for creations and edits to maintain dashboard consistency and mobile friendliness).

---

### P1 **HISTORICAL DATE ENTRY**
**Question**: Should the POS ledger support historical sales entries (back-dating sales)?
- **If yes**: We will add a datetime input selector to the sale form.
- **If no**: The date will always default to `DateTime.now()` upon order creation.

---

## Proposed Changes

### Component 1: Database Schema
#### [MODIFY] [schema.prisma](file:///f:/Level_2/Kiddiq/prisma/schema.prisma)
- Define the `DirectSale` model:
  ```prisma
  model DirectSale {
    id         String   @id @default(uuid())
    date       DateTime @default(now())
    productId  String
    product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
    quantity   Int
    price      Float
    receivedBy String
    comment    String?
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt
  }
  ```
- Update the `Product` model to include `directSales DirectSale[]`.

---

### Component 2: POS Server Actions
#### [NEW] [pos-sales.ts](file:///f:/Level_2/Kiddiq/src/app/actions/pos-sales.ts)
- Implement CRUD operations secured via `verifySessionAndPermissions(["MANAGE_ORDERS"])`:
  - `getDirectSales()`: Fetches POS ledger entries.
  - `createDirectSale(data)`: Validates stock, decrements product stock, saves sale, and writes an audit log.
  - `updateDirectSale(id, data)`: Computes stock difference, validates stock, adjusts product stock, updates sale, and writes an audit log.
  - `deleteDirectSale(id)`: Reverts/restores product stock, deletes sale, and writes an audit log.

---

### Component 3: POS Front-End Dashboard Route
#### [NEW] [page.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/pos/page.tsx)
- Expose route at `/admin/pos` protected by `verifySessionAndPermissions(["MANAGE_ORDERS"])`.
- Query all active products and POS direct sales records.
- Render the client view `<POSDashboardClient products={products} initialSales={sales} />`.

#### [NEW] [POSDashboardClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/pos/POSDashboardClient.tsx)
- Render the POS ledger grid.
- Follow **Purple Ban** and enforce $\ge 44\text{px}$ touch targets.
- Features:
  - debounced filter search
  - Dialog modal forms for Add/Edit transactions
  - Stock quantity validation
  - Instantly refreshes table data upon save or delete via transitions.

---

## Verification Plan

### Automated Checks
- Run database update: `npx prisma db push`
- Run type safety compile audit: `npx tsc --noEmit`
- Run lint validation: `npm run lint`

### Manual Verification Steps
1. Log in as Admin.
2. Navigate to POS Dashboard `/admin/pos`.
3. Create a Direct Sale entry: Select a product, input quantity 3, verify price auto-fills and stock is sufficient. Save.
4. Verify database stock level for the product is decrements by 3.
5. Edit the sale entry: change quantity from 3 to 1. Verify stock is incremented back by 2.
6. Delete the sale entry: verify stock is restored to its original value.
