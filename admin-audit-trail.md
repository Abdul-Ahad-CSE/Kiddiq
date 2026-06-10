# TSK-017: Admin Authentication Security & Audit Trail

## Goal
Enforce administrative security by tracking order and financial mutations back to the specific administrator (e.g., Ahad, Sayem, Arif) who executed them.

## Proposed Changes

### Database Schema Updates
- **File**: `prisma/schema.prisma`
- **Action**: Add `AuditLog` model to track operations.

### Seed Script Updates
- **File**: `prisma/seed.ts`
- **Action**: Seed unique admin accounts:
  - `ahad@kiddiq.com` (Ahad)
  - `sayem@kiddiq.com` (Sayem)
  - `arif@kiddiq.com` (Arif)

### Audit Trail Logger
- **File**: `src/app/actions/audit-log.ts` [NEW]
- **Action**: Implement `logAdminAction` function to write to the `AuditLog` table.

### Order Mutation Integration
- **File**: `src/app/actions/admin-orders.ts`
- **Action**: Integrate `logAdminAction` into order mutations (`verifyOrderPayment`, `rejectOrderPayment`, `updateOrderStatus`) to record the admin email.

---

## Tasks

- [ ] **Task 1: Add Database Audit Schema & Seed Admin Users**
  - Add `AuditLog` model in `schema.prisma`.
  - Update `prisma/seed.ts` to generate multiple admins.
  - Run database schema push: `npx prisma db push`.
  - Run seed: `npx prisma db seed`.

- [ ] **Task 2: Build Audit Logger Server Action**
  - Create `src/app/actions/audit-log.ts` to expose `logAdminAction`.
  - Typecheck database inputs.

- [ ] **Task 3: Instrument Order Actions with Logging**
  - Update `src/app/actions/admin-orders.ts` to log all mutations.
  - Retrieve the admin email from server session.

- [ ] **Task 4: Run Verifications & Compliance Audits**
  - Run TypeScript compile check, ESLint linter, and master validation checklist.

---

## Verification Plan

### Automated Checks
```bash
npx tsc --noEmit
npm run lint
python -X utf8 .agents/scripts/checklist.py .
```

### Manual Verification
1. Push the DB changes: `npx prisma db push`.
2. Seed database: `npx prisma db seed`.
3. Log in as `ahad@kiddiq.com` and verify a pending payment. Check that a record is added in the database `AuditLog` table showing the action `VERIFY_PAYMENT` and admin email `ahad@kiddiq.com`.
4. Log in as `sayem@kiddiq.com` and reject a pending payment. Confirm that a record is created showing `REJECT_PAYMENT` with rejection notes.
5. Log in as `arif@kiddiq.com` and progress order status. Check that `UPDATE_STATUS` is logged.
