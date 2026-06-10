# TSK-017a & TSK-017b: Dynamic RBAC & Staff Access Management

## Goal
Enforce administrative security by introducing a dynamic Role-Based Access Control (RBAC) system with Super Admins and Sub Admins, dynamic audit logs tracking administrative actions, and a Super-Admin-only Staff Management interface to provision Sub-Admins.

## Proposed Changes

### Database Schema Updates
- **File**: `prisma/schema.prisma`
- **Action**: 
  - Update `Role` enum to support `SUPER_ADMIN`, `SUB_ADMIN`, and `CUSTOMER`.
  - Add `permissions` (String[]) and `isActive` (Boolean) to `User`.
  - Update `AuditLog` model to include `adminRole` (Role enum).

### NextAuth & Authorization
- **Files**: `src/lib/auth.ts`, `src/types/next-auth.d.ts` [NEW], `src/lib/auth-utils.ts` [NEW]
- **Action**: 
  - Extend session/user definitions to support `role` and `permissions`.
  - Inject values inside NextAuth token and session callbacks.
  - Implement `verifySessionAndPermissions` helper to protect routes and server actions.

### Staff Access Management
- **Files**: `src/app/actions/admin-staff.ts` [NEW], `src/app/admin/staff/page.tsx` [NEW], `src/app/admin/staff/StaffManagementClient.tsx` [NEW]
- **Action**:
  - Build server actions to add, suspend, update permissions, or delete Sub-Admins.
  - Create a Super-Admin-only dashboard at `/admin/staff` to manage Sub-Admins and toggle access rights.

### Order Mutation Audit Integration
- **Files**: `src/app/actions/admin-orders.ts`, `src/app/actions/audit-log.ts` [NEW]
- **Action**:
  - Expose `logAdminAction` database logger.
  - Call logger inside order verification, rejection, and status progress mutations.

---

## Tasks

- [ ] **Task 1: Add Database Audit & RBAC Schema**
  - Update `Role` enum and add `permissions` / `isActive` to `User` in `schema.prisma`. Ensure permissions maps to the exhaustive list: `['VIEW_DASHBOARD', 'MANAGE_ORDERS', 'MANAGE_CATEGORIES', 'MANAGE_PRODUCTS', 'MANAGE_FINANCE']`.
  - Add `adminRole` to `AuditLog`.
  - Run database schema push: `npx prisma db push`.
  - Update `prisma/seed.ts` to seed only a single initial `SUPER_ADMIN`.
  - Run seed: `npx prisma db seed`.

- [ ] **Task 2: Build NextAuth Callbacks & Authorization Utilities**
  - Create `src/types/next-auth.d.ts` extending user/session types.
  - Modify `src/lib/auth.ts` credentials authorize and jwt/session callbacks.
  - Create `src/lib/auth-utils.ts` with the permission checking helper mapping to the 5 granular permission keys.
  - Update `src/app/admin/layout.tsx` to handle conditional sidebar link rendering based on permissions, and strict page-level route redirects/unauthorized blocks for Sub-Admins.

- [ ] **Task 3: Build Staff Management Server Actions**
  - Create `src/app/actions/admin-staff.ts` with `createSubAdmin`, `updateSubAdminPermissions`, `toggleSubAdminSuspension`, and `deleteSubAdmin`.
  - Instrument actions with session authorization validation.

- [ ] **Task 4: Design Staff Management UI (Super Admin Only)**
  - Create Server Component at `src/app/admin/staff/page.tsx` querying Sub-Admins.
  - Build/Update client component `StaffManagementClient.tsx` with checkboxes for all 5 new granular permissions in the creation and edit modals.

- [ ] **Task 5: Instrument Order Actions with Auditing**
  - Create `src/app/actions/audit-log.ts` to record log entries.
  - Update `verifyOrderPayment`, `rejectOrderPayment`, and `updateOrderStatus` in `admin-orders.ts` to require `MANAGE_ORDERS` permission and log administrative actions dynamically.

- [ ] **Task 6: Run Verifications & Compliance Audits**
  - Verify compilation, lint rules, and run master validator checklist.

---

## Verification Plan

### Automated Checks
```bash
npx tsc --noEmit
npm run lint
python -X utf8 .agents/scripts/checklist.py .
```

### Manual Verification
1. Push DB schema: `npx prisma db push`.
2. Seed DB: `npx prisma db seed`.
3. Log in with the initial Super Admin. Verify that the "Staff" link appears in the sidebar.
4. Go to `/admin/staff`, add a Sub Admin `sub@kiddiq.com` and grant only the `MANAGE_ORDERS` permission. Check the `AuditLog` table to verify this action was logged.
5. Log in as `sub@kiddiq.com`. Verify that visiting `/admin/orders` is allowed and mutations succeed, while visiting `/admin/finance` or `/admin/staff` is blocked.
6. Log back in as Super Admin, suspend `sub@kiddiq.com`. Confirm that they are immediately logged out or credentials validation is blocked.
