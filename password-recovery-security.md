# Password Recovery & Security (TSK-024C)

## Goal
Implement a secure, token-based password recovery flow (forgot password and reset password) using hashed tokens, expiry validation, and generic feedback.

## Tasks
- [ ] Task 1: Create Server Actions in `src/app/actions/auth-recovery.ts` supporting token creation and password resets → Verify: Actions compile cleanly; `requestPasswordReset` hashes tokens in database and logs the raw token link, while `executePasswordReset` validates tokens and updates hashed passwords securely.
- [ ] Task 2: Create forgot password request route `src/app/forgot-password/page.tsx` containing email input form → Verify: Form uses Zod checks, complies with Purple Ban, has h-12 inputs, and displays a generic confirmation message regardless of email existence.
- [ ] Task 3: Create reset password form route `src/app/reset-password/page.tsx` accepting query token parameter → Verify: Page validates query token, displays password & confirm password inputs (h-12), checks password strength, resets the hash on match, and redirects to `/login?reset=true`.
- [ ] Task 4: Run compiler, linter, and project verification checklist scripts → Verify: `npx tsc --noEmit`, `npm run lint`, and `python -X utf8 .agents/scripts/checklist.py .` compile successfully.

## Done When
- [ ] Users can trigger password reset requests, retrieve raw tokens from server logs, visit `/reset-password?token=...`, update passwords using secure hashes, and log in successfully.
- [ ] All automated type checks, linter checks, and checklist validation tests pass cleanly.

## Notes
- Do not store raw tokens in the database; hash them using SHA-256 before writing to DB.
- Prevent user enumeration by returning generic recovery messages.
- Clear/nullify reset token fields from database immediately after use.
- Enforce the Purple Ban strictly (use slates, brand blues, emerald accents; no purple/indigo).
- Enforce Touch Targets of at least 44px on all form buttons and inputs.
