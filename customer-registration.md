# Customer Registration Foundation (TSK-024A)

## Goal
Implement customer database schema extensions, registration server actions, signup UI routes, and navbar links.

## Tasks
- [x] Task 1: Add optional fields (`phone`, `district`, `area`, `fullAddress`, `resetToken`, `resetTokenExpiry`) to `User` model in `prisma/schema.prisma` → Verify: Run `npx prisma db push` successfully and verify types regenerate.
- [x] Task 2: Implement registration Server Action `registerCustomer(data)` in `src/app/actions/auth-register.ts` → Verify: Action parses inputs with Zod, hashes passwords using bcrypt, saves to DB with role `CUSTOMER`, and returns a success payload.
- [x] Task 3: Create customer registration page `src/app/register/page.tsx` with name, email, and password form → Verify: Uses React Hook Form with Zod schema (min 6 characters for password), complies with Purple Ban, and enforces touch target height >= 44px (`h-12`).
- [x] Task 4: Update navbar component `src/components/Navbar.tsx` to add "Register" link beside "Login" → Verify: Link is visible to guest users on both desktop and mobile layouts.
- [x] Task 5: Run compiler, linter, and project verification check scripts → Verify: `npx tsc --noEmit`, `npm run lint`, and `python -X utf8 .agents/scripts/checklist.py .` compile successfully.

## Done When
- [x] Guest users can access `/register`, sign up with valid credentials, get added to DB with role `CUSTOMER`, and navigate/log in successfully.
- [x] All automated type checks, linter checks, and checklist validation tests pass cleanly.

## Notes
- `Role.CUSTOMER` and the default default role assignment are already present in the DB schema, so we do not need to redefine the enum value.
- Storefront data leakage checks remain verified (public pages omit `costPrice`).
