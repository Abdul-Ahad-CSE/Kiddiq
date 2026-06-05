# Mobile-First Homepage Rebuild Plan (TSK-007)

## Overview
This plan outlines the complete rewrite of the Kiddiq homepage (TSK-007) from scratch using a strict mobile-first design approach. The existing homepage code in `src/app/page.tsx` will be completely removed and replaced with a clean, responsive layout built for touch-first interaction, optimized for vertical reading on small screens, and progressively scaled up to tablet and desktop viewports using Tailwind CSS v4.

## Project Type
WEB (Next.js, Tailwind v4, Prisma, NextAuth, Zustand, Framer Motion)

## Success Criteria
- **Mobile-First Layouts**: Default styles target small viewports (320px–479px) with vertical stacks, then progressively use `sm:`, `md:`, and `lg:` for larger screens.
- **Touch-First Accessibility**: All interactive items, buttons, links, and category cards have touch target sizes of at least 44x44px to prevent accidental taps.
- **Hero Background Animation**: Subtle CSS-only animated SVG toy car (opacity 5-10%, linear loop, 15-25s duration) positioned behind Hero content. Marked as `aria-hidden` and respects `prefers-reduced-motion` settings.
- **Color Compliance**: Exclusive use of approved brand colors (e.g., slate, brand-yellow, brand-blue, emerald, orange, pink). No colors from the disallowed spectrum (e.g. shades of grape, plum, or lavender) or corresponding hex codes.
- **Performance**: Lightweight Framer Motion animations that render smoothly on mobile and respect the `prefers-reduced-motion` setting.
- **Clean Build**: Project compiles successfully and passes all typescript, lint, and security checks.

## Tech Stack
- **Next.js 14+ (App Router)**: Framework for server-rendered components, routing, and dynamic data fetching.
- **Tailwind CSS v4**: Utility-first CSS framework for mobile-first responsive design.
- **Framer Motion**: React animation library for mobile-friendly transition animations.
- **Prisma**: Database ORM to query categories and featured products.
- **Lucide React**: Playful, clear icons for category and feature callouts.

## File Structure
Only the following files are involved:
- `src/app/page.tsx`: The primary landing page.
- `src/components/ProductCard.tsx`: Product display card component (read-only reference).

---

## Task Breakdown

### Task 1: Identify and Clean Up Existing Homepage Code
- **task_id**: TSK-007-001
- **name**: Cleanup of Existing Homepage
- **agent**: frontend-specialist
- **skills**: [clean-code, simplify-code]
- **priority**: P0
- **dependencies**: None
- **INPUT**: Existing `src/app/page.tsx` file.
- **OUTPUT**: Cleaned `src/app/page.tsx` baseline containing only the database queries for categories and products, imports, and a minimal wrapper.
- **VERIFY**: Run `npm run lint` and `npx tsc --noEmit` to verify code compiles cleanly without errors.

### Task 2: Implement the Mobile-First Hero Section
- **task_id**: TSK-007-002
- **name**: Hero Section Rebuild
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P1
- **dependencies**: TSK-007-001
- **INPUT**: Baseline `src/app/page.tsx`.
- **OUTPUT**: Rebuilt Hero section designed mobile-first. Features:
  - Single-column layout by default.
  - Call-To-Action (CTA) buttons ("Shop Now", "Explore Skills") styled with padding yielding a touch target of at least 48px height.
  - Trust indicators stacked vertically on mobile, scaling to a grid on larger viewports.
  - Hero image stacked below the text content on mobile, moving to a side-by-side two-column grid (`lg:grid-cols-12`) on desktop.
- **VERIFY**: Start the local server using `npm run dev` and verify layout at 375px screen width. Inspect CTA touch target sizes in developer tools to ensure they are >= 44x44px.

### Task 2b: Implement Subtle SVG Hero Background Animation
- **task_id**: TSK-007-002b
- **name**: Hero SVG Background Animation
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P2
- **dependencies**: TSK-007-002
- **INPUT**: Hero section React structure.
- **OUTPUT**:
  - A simple inline flat SVG representing a toy car, styled with Kiddiq branding colors (soft blue/yellow).
  - Absolute positioned background container (`absolute inset-0 overflow-hidden pointer-events-none -z-10`).
  - CSS keyframes for animation (`@keyframes drive { 0% { transform: translateX(-15%); } 100% { transform: translateX(115%); } }`).
  - Low opacity (5-10%), linear ease, loop duration 15-25 seconds.
  - Marked as `aria-hidden="true"`.
  - Respects `@media (prefers-reduced-motion: reduce)` by disabling/pausing the animation.
- **VERIFY**: Open browser, check that the car drives across the screen. Verify in CSS that a prefers-reduced-motion media query is present and disables transitions/animations.


### Task 3: Implement Best Sellers Section with Responsive Scaling
- **task_id**: TSK-007-003
- **name**: Best Sellers Section Rebuild
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P1
- **dependencies**: TSK-007-001
- **INPUT**: `products` array from Prisma query and `ProductCard` component.
- **OUTPUT**: Best Sellers section showing top-rated products in a responsive grid. Features:
  - 1-column layout on mobile (`grid-cols-1`).
  - Scales to 2 columns on tablet (`sm:grid-cols-2`) and 4 columns on desktop (`lg:grid-cols-4`).
- **VERIFY**: Check layout scaling across breakpoints. Confirm there is no horizontal page overflow or text truncation on small screen sizes.

### Task 4: Implement Shop by Category Mobile-First Grid
- **task_id**: TSK-007-004
- **name**: Categories Section Rebuild
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P1
- **dependencies**: TSK-007-001
- **INPUT**: `categories` array queried from the database.
- **OUTPUT**: Categories list designed mobile-first. Features:
  - 1-column stack layout on mobile devices.
  - Progressive scaling to 2 columns on tablet (`md:grid-cols-2`) and 3 columns on desktop (`lg:grid-cols-3`).
  - Cards act as clean, large touch targets (>= 44x44px clickable area).
- **VERIFY**: Resize the browser viewport down to mobile width (375px) and verify the category list stacks vertically. Tap/click on category cards to confirm redirection works.

### Task 5: Implement Benefits and Testimonials Sections
- **task_id**: TSK-007-005
- **name**: Benefits & Reviews Sections Rebuild
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P2
- **dependencies**: TSK-007-001
- **INPUT**: `benefitCards` and `testimonials` data structures.
- **OUTPUT**:
  - Why Choose Us section: Stacked list layout on mobile, scaling to 3 columns on desktop.
  - Direct WhatsApp Checkout CTA card: Features a prominent target button (>= 44px) that is easily clickable on touchscreens.
  - Testimonials section: 1-column layout on mobile for vertical scrolling, scaling to 3 columns on desktop.
- **VERIFY**: Verify readability of text elements on 320px viewport. Ensure the WhatsApp link is fully active and has a large, touch-safe container area.

### Task 6: Add Mobile-Friendly Animations
- **task_id**: TSK-007-006
- **name**: Framer Motion Integration
- **agent**: frontend-specialist
- **skills**: [frontend-design, clean-code]
- **priority**: P2
- **dependencies**: TSK-007-002, TSK-007-002b, TSK-007-003, TSK-007-004, TSK-007-005
- **INPUT**: Framer wrapper animations (`FadeIn`, `StaggerContainer`, `StaggerItem`).
- **OUTPUT**: Smooth entry transitions applied to homepage sections. Animations are customized to be performant on mobile (e.g. subtle vertical shifts and opacity fades rather than complex GPU-heavy transforms) and support reduced motion.
- **VERIFY**: Test page loading on a mobile simulator. Verify animation frames are fluid (>= 60 FPS) and check that animations are skipped if the user has `prefers-reduced-motion` enabled.

---

## Phase X: Final Verification

### Step 1: Quality Audit Commands
Execute the following verification tools in priority order:
1. **Lint & TypeScript Validation**:
   ```powershell
   npm run lint
   npx tsc --noEmit
   ```
2. **Security & Secrets Check**:
   ```powershell
   python .agents/skills/vulnerability-scanner/scripts/security_scan.py .
   ```
3. **UX & Accessibility Check**:
   ```powershell
   python .agents/skills/frontend-design/scripts/ux_audit.py .
   ```
4. **Mobile Target & Touch Verification**:
   - Inspect components manually to ensure all buttons, links, and cards have `min-h-[44px]` or `min-w-[44px]`.

### Step 2: Build Verification
```powershell
npm run build
```
Ensure the build succeeds with no dynamic route rendering errors.

### Step 3: Runtime Verification
```powershell
npm run dev
```
Open a browser, toggle the device toolbar, select a mobile profile (e.g., iPhone SE/12 Pro), and manually verify:
- Layout stacks perfectly vertically with no horizontal scrolling.
- Buttons and cards are easily tapable.
- Visual animations are smooth.
- No colors outside the allowed brand spectrum are present.
