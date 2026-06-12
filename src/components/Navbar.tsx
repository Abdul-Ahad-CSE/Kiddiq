"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { 
  ShoppingBag, 
  Heart, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  LayoutDashboard 
} from "lucide-react";
import { useCartState } from "@/store/useCartStore";

interface NavbarProps {
  session: Session | null;
  categories?: { name: string; slug: string; }[];
}

export default function Navbar({ session, categories: initialCategories }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zustand counters with hydration-safe wrapper
  const cartItems = useCartState((state) => state.items, []);
  const wishlist = useCartState((state) => state.wishlist, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on page change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const defaultCategories = [
    { name: "Educational Toys", slug: "educational-toys" },
    { name: "School Supplies", slug: "school-supplies" },
    { name: "Parenting Resources", slug: "parenting-resources" }
  ];
  const categories = initialCategories || defaultCategories;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Watermark */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-transform duration-200 active:scale-98">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg">
              <Image 
                src="/logo.jpg" 
                alt="Kiddiq Brand Logo" 
                fill
                priority
                className="object-cover" 
              />
            </div>
            <span className="font-sans text-2xl font-extrabold tracking-tight text-brand-blue">
              Kiddiq
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-brand-blue ${
                pathname === "/" ? "text-brand-blue font-semibold" : "text-slate-600"
              }`}
            >
              Home
            </Link>
            
            <Link 
              href="/shop" 
              className={`text-sm font-medium transition-colors hover:text-brand-blue ${
                pathname === "/shop" && !categories.some(c => pathname.includes(c.slug)) 
                  ? "text-brand-blue font-semibold" 
                  : "text-slate-600"
              }`}
            >
              Shop
            </Link>

            <Link 
              href="/track-order" 
              className={`text-sm font-medium transition-colors hover:text-brand-blue ${
                pathname === "/track-order" 
                  ? "text-brand-blue font-semibold" 
                  : "text-slate-600"
              }`}
            >
              Track Order
            </Link>

            {/* Categories Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand-blue outline-hidden ${
                  dropdownOpen ? "text-brand-blue" : "text-slate-600"
                }`}
              >
                Categories
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 mt-3 w-56 origin-top-left rounded-xl border border-slate-100 bg-white p-2 shadow-lg ring-1 ring-black/5 transition-all duration-200">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-blue-light hover:text-brand-blue"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section Icons & Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Wishlist Link with Count */}
          <Link 
            href="/shop?wishlist=true" 
            aria-label="Wishlist"
            className="relative p-2 text-slate-500 transition-all hover:scale-105 hover:text-brand-blue"
          >
            <Heart className="h-6 w-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link with Count */}
          <Link 
            href="/checkout" 
            aria-label="Shopping Cart"
            className="relative p-2 text-slate-500 transition-all hover:scale-105 hover:text-brand-blue"
          >
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-extrabold text-brand-blue-dark shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Auth Display (Desktop) */}
          <div className="hidden md:flex items-center gap-3 border-l border-slate-100 pl-4">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {session.user.name || "Customer"}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 capitalize">
                    {session.user.role?.toLowerCase()}
                  </span>
                </div>

                {/* Role Specific Actions */}
                {session.user.role === "CUSTOMER" && (
                  <Link
                    href="/profile"
                    title="My Profile"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}

                {(session.user.role === "SUPER_ADMIN" || session.user.role === "SUB_ADMIN") && (
                  <Link
                    href="/admin"
                    title="Admin Dashboard"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-light text-brand-blue transition-colors hover:bg-brand-blue hover:text-white"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                )}

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Log Out"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-xs h-11"
                >
                  <User className="h-4 w-4" />
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1.5 rounded-full bg-brand-blue px-5 text-sm font-semibold text-white transition-all hover:bg-brand-blue-dark hover:shadow-sm h-11"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex p-2 text-slate-600 transition-colors hover:text-brand-blue md:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-inner md:hidden">
          <nav className="flex flex-col gap-4">
            <Link 
              href="/" 
              className={`text-base font-semibold transition-colors hover:text-brand-blue ${
                pathname === "/" ? "text-brand-blue" : "text-slate-700"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/shop" 
              className={`text-base font-semibold transition-colors hover:text-brand-blue ${
                pathname === "/shop" && !categories.some(c => pathname.includes(c.slug)) 
                  ? "text-brand-blue" 
                  : "text-slate-700"
              }`}
            >
              Shop
            </Link>
            <Link 
              href="/track-order" 
              className={`text-base font-semibold transition-colors hover:text-brand-blue ${
                pathname === "/track-order" 
                  ? "text-brand-blue" 
                  : "text-slate-700"
              }`}
            >
              Track Order
            </Link>

            {/* Flat Category Links in Mobile */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Shop By Category
              </span>
              <div className="flex flex-col gap-2.5 pl-2">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/shop?category=${category.slug}`}
                    className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-blue"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Display (Mobile) */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              {session ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue font-bold text-sm">
                      {(session.user.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{session.user.name || "Customer"}</p>
                      <p className="text-xs text-slate-400 capitalize">{session.user.role?.toLowerCase()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {session.user.role === "CUSTOMER" && (
                      <Link
                        href="/profile"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-blue-light py-2.5 text-sm font-semibold text-brand-blue"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    )}

                    {(session.user.role === "SUPER_ADMIN" || session.user.role === "SUB_ADMIN") && (
                      <Link
                        href="/admin"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-blue-light py-2.5 text-sm font-semibold text-brand-blue"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 h-12"
                  >
                    <User className="h-4.5 w-4.5" />
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue py-3 text-center text-sm font-bold text-white hover:bg-brand-blue-dark h-12"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
