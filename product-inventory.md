# Product Inventory Management (TSK-019)

This plan outlines the architecture for the Product Inventory Management dashboard at `/admin/products`. It allows administrators to create, read, update, and delete educational products. It integrates multi-image uploads hosted on Cloudinary, dynamic slug generation, input validation, and role-based route access controls.

---

## User Review Required

> [!IMPORTANT]
> **Age Group Selections**:
> We will restrict the `ageGroup` input to a dropdown selector containing standard ranges matching our catalog and seed data: `["1-3 Years", "3-5 Years", "5-7 Years", "6-12 Years", "Parents", "All Ages"]`.
>
> **Benefits Input Structure**:
> To make product benefits easy to parse and display on the storefront as bullet points, the benefits field in the form will accept newline-separated text (one benefit per line) or a comma-separated list, which will be stored as a string.

---

## Open Questions

> [!NOTE]
> **Cloudinary Multiple Uploads**:
> Next-Cloudinary `CldUploadWidget` can return individual upload events in sequence. We will design `MultiImageUpload.tsx` to handle adding URLs to a list of strings, showing a list of thumbnails with clear deletion overlays. Is this interface acceptable, or do you require drag-and-drop image reordering? (Recommended: standard grid list with deletion is selected to minimize complexity).

---

## Proposed Changes

### Component 1: Multi-Image Upload UI

#### [NEW] [MultiImageUpload.tsx](file:///f:/Level_2/Kiddiq/src/components/MultiImageUpload.tsx)
- Create a client-side component for managing multiple image uploads:
  - Props interface:
    ```typescript
    interface MultiImageUploadProps {
      value: string[]; // Array of Cloudinary URL strings
      onChange: (urls: string[]) => void; // Callback when list changes
    }
    ```
  - Displays a responsive grid of uploaded image thumbnails:
    - Each thumbnail displays a hover overlay "X" button to remove that specific image from the list.
    - If the number of uploaded images is less than 5, render the `CldUploadWidget` dropzone as an additional grid cell.
  - Utilizes `CldUploadWidget` configured to support uploading webp, png, and jpeg images.
  - Fully compliant with the **Purple Ban** and $\ge 48\text{px}$ touch targets for delete actions.

---

### Component 2: Product Server Actions

#### [NEW] [admin-products.ts](file:///f:/Level_2/Kiddiq/src/app/actions/admin-products.ts)
- Create a server action file protected by `verifySessionAndPermissions(["MANAGE_PRODUCTS"])`:
  - Enforce schema validations using Zod:
    ```typescript
    const productSchema = z.object({
      title: z.string().min(2).max(100),
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
      description: z.string().min(5),
      price: z.number().positive(),
      categoryId: z.string().uuid(),
      ageGroup: z.string().min(1),
      images: z.array(z.string().url()).min(1, "At least one product image is required"),
      stock: z.number().int().nonnegative(),
      benefits: z.string().min(2),
      featured: z.boolean().default(false),
    });
    ```
  - Export actions:
    1. `createProduct(data)`:
       - Validate using `productSchema`.
       - Check if slug is unique.
       - Save to database.
       - Log action `CREATE_PRODUCT` in `AuditLog`.
    2. `updateProduct(id, data)`:
       - Verify product exists.
       - Validate inputs and verify slug uniqueness.
       - Update product record.
       - Log action `UPDATE_PRODUCT` in `AuditLog`.
    3. `deleteProduct(id)`:
       - Verify product exists.
       - Delete product record (safely triggers cascade reviews/wishlist deletes, but no other entities depend on Product).
       - Log action `DELETE_PRODUCT` in `AuditLog`.

---

### Component 3: Page Route & Layout

#### [NEW] [page.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/products/page.tsx)
- Create a Server Component entry page restricted to users with `SUPER_ADMIN` or `SUB_ADMIN` with `MANAGE_PRODUCTS` permission.
- Query all products including their category name from Prisma:
  `prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } })`.
- Query all categories (to populate the form category selection list):
  `prisma.category.findMany({ orderBy: { name: 'asc' } })`.
- Render `<ProductManagementClient initialProducts={products} categories={categories} />`.

#### [NEW] [ProductManagementClient.tsx](file:///f:/Level_2/Kiddiq/src/app/admin/products/ProductManagementClient.tsx)
- Create the interactive dashboard Client Component:
  - **Header and Controls**: Dashboard metrics (total products, out of stock count), search bar, and "Add Product" button.
  - **Product Table (Desktop) & Cards Stack (Mobile)**:
    - Desktop Table Columns: Thumbnail (first image in array), Title, Category, Age Group, Price, Stock (styled red if 0, amber if <= 5), Featured indicator, Actions (Edit, Delete).
    - Mobile Card: Collapses rows into an info card with clean borders.
    - Touch targets for actions $\ge 48\text{px}$.
  - **Create/Edit Product Modal Dialog**:
    - Standard text inputs, category selection dropdown, age group dropdown.
    - Integrates the new `MultiImageUpload` component for the images list.
    - Auto-generates slug from title.
    - Uses React `useTransition` to show loading states during save.
  - **Delete Modal Dialog**:
    - Confirm deletion before invoking action.
  - Complies with the **Purple Ban** (slate/blue/emerald HSL colors).

---

## Verification Plan

### Automated Tests
- Type checking: `npx tsc --noEmit`
- Linter validation: `npm run lint`
- Master verification checklist: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification
1. **Permission Check**: Log in as a Sub-Admin without `MANAGE_PRODUCTS` permission. Verify attempts to access `/admin/products` redirects to `/admin` and Server Actions return authorization failures.
2. **Product Creation**:
   - Create a product `Logic Wooden Puzzle`. Upload 3 images, enter stock (e.g. 10), price, select category `Educational Toys`, select Age Group `3-5 Years`.
   - Verify it appears in the products list and matches database values.
3. **Product Update**:
   - Edit the newly created product. Remove one image, add a new one, change stock count. Save and verify.
4. **Delete Product**:
   - Delete the product, confirm that the row disappears, and verify that the deletion logs in `AuditLog`.
