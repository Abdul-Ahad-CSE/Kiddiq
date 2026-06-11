# Plan: Fix Admin Image Upload Bug & Implement Dynamic Image Carousel (TSK-020)

## Goal
Resolve the stale closure state bug in the Admin multiple image upload component so that up to 5 image links are correctly saved to the database. Render a responsive, touch-friendly image carousel with interactive thumbnails on the product details page.

---

## Proposed Changes

### Component 1: Admin Multi-Image Upload State

#### [MODIFY] [MultiImageUpload.tsx](file:///f:/Level_2/Kiddiq/src/components/MultiImageUpload.tsx)
* Introduce a `useRef` to store the latest `value` prop:
  ```typescript
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  ```
* Modify `handleSuccess` callback to reference `valueRef.current` instead of `value`, preventing Cloudinary's onSuccess wrapper from enclosing a stale reference of the empty array:
  ```typescript
  const handleSuccess = (result: unknown) => {
    const info = (result as { info?: { secure_url?: string } })?.info;
    if (info?.secure_url) {
      onChange([...valueRef.current, info.secure_url]);
    }
  };
  ```

---

### Component 2: Storefront Product Details page

#### [MODIFY] [ProductDetailsClient.tsx](file:///f:/Level_2/Kiddiq/src/app/product/%5Bslug%5D/ProductDetailsClient.tsx)
* Confirm and refine the image carousel rendering layout:
  * Display `imageUrls[activeImgIndex]` inside the main container with drag and overlay navigation support.
  * Below the main container, render a list of clickable thumbnails mapping over `imageUrls` (only if `imageUrls.length > 1`).
  * Ensure the active thumbnail has a clear active indicator (`border-brand-blue` / HSL style, conforming to the **Purple Ban**).
  * Enforce touch targets for thumbnails to be at least $44 \times 44\text{px}$ (e.g. using `min-h-[44px] min-w-[44px] h-16 w-16`).

---

## Layout & Sizing Hierarchy (Mobile-First)

- **Mobile (< 1024px)**:
  - Stacked layout (Carousel gallery on top, details list underneath).
  - Main view aspect-square image.
  - Thumbnails horizontally scrolling row below the main image.
- **Desktop (>= 1024px)**:
  - 12-column side-by-side grid (`grid grid-cols-12`).
  - Left column (`lg:col-span-6 xl:col-span-5`): Carousel (featured main image + thumbnails row underneath).
  - Right column (`lg:col-span-6 xl:col-span-7`): Category link, title, prices, badges, developmental benefits, and action buttons.

---

## Verification Plan

### Automated Checks
- Validate type safety: `npx tsc --noEmit`
- Validate formatting and lint constraints: `npm run lint`
- Validate project checklist: `python -X utf8 .agents/scripts/checklist.py .`

### Manual Verification Steps
1. **Admin Product Form**:
   - Go to `/admin/products`.
   - Click "Add Product" or edit an existing product.
   - Upload 3 image assets in sequence. Confirm the preview thumbnails show all 3 images instead of overwriting.
   - Save the product. Reload the form and confirm that the 3 image URLs were successfully saved to the database.
2. **Product Details Carousel**:
   - Navigate to `/product/[slug]` of the created product.
   - Verify the main image shows the first image by default.
   - Click the 2nd and 3rd thumbnails. Confirm the main featured image changes instantly.
   - Check mobile layout to verify the thumbnail list scrolls horizontally.
   - Test a product with only 1 image and confirm that the thumbnail list is hidden.
