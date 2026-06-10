# Category Management Interface (TSK-018)

This plan outlines the architecture for the Category CRUD management interface located at `/admin/categories`. It enables administrators to create, read, update, and delete categories. It integrates Cloudinary image uploads, database safety checks to prevent accidental product deletion, and role-based route access controls.

---

## User Review Required

> [!IMPORTANT]
> **Database Schema Changes**:
> We need to add a `text` (description text) field to the `Category` model inside `prisma/schema.prisma`. This requires running `npx prisma db push` to synchronize changes with Neon Postgres.
>
> **Proposed Schema Addition**:
> ```prisma
> model Category {
>   // ... existing fields
>   text  String   @default("") // Description text
> }
> ```

> [!WARNING]
> **Cascade Deletion Safeguard**:
> The existing relation defines `category Category @relation(..., onDelete: Cascade)`. If a category is deleted, PostgreSQL will automatically delete all products under it.
> To prevent massive accidental inventory deletion, our Server Action (`deleteCategory`) must query the product count for that category first. If products exist, the action must block deletion and return a validation error.

---

## Resolved Design Decisions

- **Cloudinary Upload Widget Integration**:
  - The Category creation/edit modals will consume the reusable `ImageUpload` component. When a new image is uploaded, Cloudinary returns a secure URL string, which is stored directly inside the `image` field in the database.
- **Auto-Generating Slugs**:
  - When creating a Category, the modal will automatically generate a URL-friendly slug based on the Name field (e.g. `School Supplies` -> `school-supplies`). Administrators can manually override the slug if needed.

---

## Proposed Changes

### Component 1: Database & Seeding

#### [MODIFY] [schema.prisma](file:///f:/Level_2/Kiddiq/prisma/schema.prisma)
- Add `text` field to `Category` model:
  ```prisma
  model Category {
    id        String    @id @default(uuid())
    name      String    @unique
    slug      String    @unique
    image     String
    text      String    @default("")
    products  Product[]
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
  }
  ```

#### [MODIFY] [seed.ts](file:///f:/Level_2/Kiddiq/prisma/seed.ts)
- Update flat categories seeding array to populate the `text` attribute with default descriptions.

---

### Component 2: Categories Server Actions

#### [NEW] [admin-categories.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-categories.ts)
- Export the following server actions, protected by `verifySessionAndPermissions(["MANAGE_CATEGORIES"])`:
  1. `createCategory(data: { name: string; slug: string; image: string; text: string })`:
     - Verify session & permissions.
     - Validate input data using Zod (`name`, `slug` format, `image` URL string).
     - Save to database.
     - Log action `CREATE_CATEGORY` in `AuditLog`.
  2. `updateCategory(id: string, data: { name: string; slug: string; image: string; text: string })`:
     - Verify session & permissions.
     - Validate input data.
     - Update record in database.
     - Log action `UPDATE_CATEGORY` in `AuditLog`.
  3. `deleteCategory(id: string)`:
     - Verify session & permissions.
     - **Safety Guard Check**: Query `prisma.product.count({ where: { categoryId: id } })`. If count > 0, throw/return error: *"Cannot delete category: active products are attached. Please reassign or delete the products first."*
     - If count is 0, delete the category record.
     - Log action `DELETE_CATEGORY` in `AuditLog`.

---

### Component 3: Pages & UI Rendering

#### [NEW] [page.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/categories/page.tsx)
- Create a Server Component entry page at `/admin/categories`.
- **Page-Level Route Protection**:
  - Fetch active session via `getServerSession`.
  - If user is not `SUPER_ADMIN` and lacks `MANAGE_CATEGORIES` permission, redirect to `/admin`.
- Fetch all categories from the database: `prisma.category.findMany({ orderBy: { name: 'asc' } })`.
- Render `<CategoryManagementClient initialCategories={categories} />`.

#### [NEW] [CategoryManagementClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/categories/CategoryManagementClient.tsx)
- Build an interactive client component for managing categories:
  - **Top Action Bar**: Contains title, count, and **"Add Category"** button.
  - **Categories Ledger List (Desktop Table & Mobile Stack)**:
    - Displays category thumbnail, name, slug, description (`text`), and actions (Edit, Delete).
    - Touch targets for all edit/delete buttons $\ge 48\text{px}$.
  - **Add/Edit Category Modal Dialog**:
    - Dialog pops up containing form fields: Name, Slug (with auto-generation sync), Description, and the `ImageUpload` component.
    - Standard form validation with visual pending/disabled submit states using `useTransition` and `router.refresh()`.
  - **Delete Confirmation Modal**:
    - Displays warning modal to confirm deletion. Shows validation error banner if the Server Action returns a safeguard block (active products check).
  - Complies with **Purple Ban** (uses slate, zinc, brand blue, and emerald accents).

---

## Verification Plan

### Automated Tests
- Type checking: `npx tsc --noEmit`
- Linter validation: `npm run lint`
- Master verification checklist: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
1. **Schema Check**: Push schema changes via `npx prisma db push` and verify `text` field exists.
2. **Permission Check**: Log in as a Sub-Admin without `MANAGE_CATEGORIES`. Verify they cannot access `/admin/categories` and attempts to invoke Server Actions directly throw a 403 Forbidden error.
3. **Seeding & Navbar Check**: Run seed script, open public homepage, and verify navigation dropdown lists categories correctly.
4. **CRUD CRUD CRUD**:
   - Create a new category `Math Puzzles`, upload a mock image, check that Cloudinary URL is returned and stored.
   - Edit the description.
   - Attach a mock product to `Math Puzzles`. Attempt to delete the category, and verify the safety guard blocks deletion with a clear warning.
   - Remove the mock product, delete the category, and check that deletion succeeds and is logged in the `AuditLog` table.
