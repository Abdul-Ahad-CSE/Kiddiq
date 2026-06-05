# Plan - Navigation Shell (Navbar & Footer)

This plan outlines the design, implementation, and verification details for **TSK-006: Navigation Shell (Navbar & Footer)** of the Kiddiq e-commerce platform. It focuses on creating a high-fidelity, responsive shell around the brand logo and visual identity while strictly respecting the Purple Ban styling rules.

## Overview
- **Project Type**: WEB (Next.js App Router, TypeScript)
- **Primary Agent**: `frontend-specialist`
- **Primary Skill**: `frontend-design`

We will implement the main navigation layout comprising a sticky header (`Navbar.tsx`) and an informative, high-trust footer (`Footer.tsx`). These components will wrap the entire application layout, ensuring users can browse the storefront, search for products, view their cart/wishlist counters, and sign in/out seamlessly.

---

## Success Criteria
1. **Consistent Layout**: Navbar and Footer wrap all pages via `RootLayout`.
2. **Visual Identity**: The official Kiddiq logo (`public/logo.jpg`) is placed prominently.
3. **Purple Ban Compliance**: Styling contains absolutely no purple, violet, or indigo class names or hex codes. Color scheme focuses on brand-blue (`#0f4c81`), brand-yellow (`#f59e0b`), slate-900 (footer background), and warm neutrals.
4. **Zustand Counters**: Cart and Wishlist badge counts sync dynamically with localStorage via the Zustand store and `useCartState` without SSR hydration errors.
5. **Session integration**: Navbar dynamically adapts based on NextAuth session status:
   - For Guests: Shows "Login" link.
   - For Authenticated Customers: Displays user name or icon.
   - For Admin Users: Renders a distinctive link to the "/admin" dashboard.
6. **Mobile Friendly**: The Navbar contains a responsive burger menu that unfolds into a slide-out drawer on mobile screens.
7. **Accessibility (WCAG AA)**: Links and buttons have clear focus states, hover animations (lift, shadow, color shift), and semantic tags.

---

## Proposed Changes

### Component Layer

#### [NEW] [Navbar.tsx](file:///f:/Level_2/Kiddiq/src/components/Navbar.tsx)
- Premium, glassmorphism-enhanced sticky header with white background (`bg-white/95 backdrop-blur-md`).
- Brand logo on the left, navigation items (Home, Shop, Categories) in the center.
- Cart and Wishlist icons on the right with animated notification badges showing the respective count.
- Authentication status button (using NextAuth session: displays "Login" or user sign-out controls/admin dashboard link).
- Mobile burger toggler with animated transitions.

#### [NEW] [Footer.tsx](file:///f:/Level_2/Kiddiq/src/components/Footer.tsx)
- High-trust footer section styled in slate/dark-blue themes (`bg-slate-900 text-slate-300`).
- Columns for:
  - Brand summary with the official logo watermark.
  - Categories (flat architecture: Educational Toys, School Supplies, Parenting Resources).
  - Quick Info (WhatsApp Support, delivery area info).
  - Account (Login/Register, Cart, Wishlist).
- Highlight trust factors: "COD + Advance bKash/Nagad", "Chittagong Delivery: 60 BDT", "Outside: 120 BDT".

### Core Layout Integration

#### [MODIFY] [layout.tsx](file:///f:/Level_2/Kiddiq/src/app/layout.tsx)
- Wrap the main page content inside the Navbar and Footer shell.
- Make the main container flex-grow to push the footer to the bottom.

### Assets

#### [NEW] [logo.jpg](file:///f:/Level_2/Kiddiq/public/logo.jpg)
- Copy the attached brand logo `media__1780661484514.jpg` from the conversation directory to `public/logo.jpg`.

---

## Detailed Task Breakdown

### Task 1: Asset Preparation & Logo Bootstrap
- **Agent**: `frontend-specialist`
- **Skill**: `clean-code`
- **Priority**: `P1`
- **Dependencies**: `None`
- **INPUT**: `C:\Users\ABDUL AHAD\.gemini\antigravity\brain\4138fc47-26c2-4d57-92ec-ddb2756fb6bd\media__1780661484514.jpg`
- **OUTPUT**: `f:\Level_2\Kiddiq\public\logo.jpg`
- **Details**: Copy the source logo image to the project's public folder so it can be referenceable by Next.js `<Image />` component.
- **VERIFY**: Check that the file exists at `/public/logo.jpg` and is viewable.

### Task 2: Create Navbar Component
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`, `nextjs-react-expert`
- **Priority**: `P2`
- **Dependencies**: `Task 1`, `TSK-005`
- **INPUT**: `src/store/useCartStore.ts`
- **OUTPUT**: `src/components/Navbar.tsx`
- **Details**: 
  - Build the component. Use standard Next.js `Link` and Lucide icons (`ShoppingBag`, `Heart`, `User`, `Menu`, `X`, `LayoutDashboard`).
  - Read cart items and wishlist count using the hydration-safe `useCartState`.
  - Fetch NextAuth session using `getServerSession` (passed as props) or use client-side authentication callbacks where applicable.
  - Implement mobile responsive layout with state-driven slide-out navigation.
  - Add micro-animations (hover shifts, scale lifts) with custom CSS classes.
- **VERIFY**: Check lint results and type checks. No purple/violet color definitions used.

### Task 3: Create Footer Component
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: `P2`
- **Dependencies**: `Task 1`
- **INPUT**: None
- **OUTPUT**: `src/components/Footer.tsx`
- **Details**:
  - Build a responsive multi-column footer layout.
  - Add flat category navigation links.
  - Add high-trust badges highlighting Chittagong-focused shipping, hybrid payment options (Advance + COD), and a pre-configured WhatsApp customer service shortcut link.
- **VERIFY**: Verify styling compliance and link targets.

### Task 4: Integrate Shell in RootLayout
- **Agent**: `frontend-specialist`
- **Skill**: `nextjs-react-expert`
- **Priority**: `P2`
- **Dependencies**: `Task 2`, `Task 3`
- **INPUT**: `src/app/layout.tsx`
- **OUTPUT**: `src/app/layout.tsx`
- **Details**:
  - Import `Navbar` and `Footer` in `src/app/layout.tsx`.
  - Fetch the NextAuth session on the server side using `getServerSession` and pass it to the Navbar.
  - Structure the layout:
    ```tsx
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
    ```
- **VERIFY**: Compile the project with `npm run build` to ensure no server-side compilation or routing errors exist.

---

## Verification Plan

### Automated Tests
- Run code check scripts:
  ```powershell
  npx tsc --noEmit
  npm run lint
  python .agents/scripts/checklist.py .
  ```

### Manual Verification
- Start local development server:
  ```powershell
  npm run dev
  ```
- Open browser at `http://localhost:3000` to inspect:
  1. Logo rendering and dimensions.
  2. Mobile responsiveness (viewport scaling).
  3. Interactive hover effects on Navbar/Footer elements.
  4. Cart & Wishlist counters increase dynamically when mock state changes.
  5. Admin/Logout button appears correctly when logged in with the seeded admin account.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-05

