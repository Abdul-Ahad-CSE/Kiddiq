import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  isPreorder?: boolean;
  preorderAdvancePercent?: number;
  preorderETA?: string | null;
}

export interface CouponState {
  code: string;
  discountPercent: number;
  minOrderAmount: number;
}

interface CartStore {
  items: CartItem[];
  wishlist: string[];
  appliedCoupon: CouponState | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (coupon: CouponState | null) => void;
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    if (item.isPreorder) {
      const advancePercent = item.preorderAdvancePercent ?? 50;
      return acc + (item.price * (advancePercent / 100)) * item.quantity;
    }
    return acc + item.price * item.quantity;
  }, 0);
}

export function getStandardSubtotal(items: CartItem[]): number {
  return items
    .filter((item) => !item.isPreorder)
    .reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function checkCouponValidity(items: CartItem[], coupon: CouponState | null): CouponState | null {
  if (!coupon) return null;
  const standardSubtotal = getStandardSubtotal(items);
  if (standardSubtotal < coupon.minOrderAmount) {
    return null;
  }
  return coupon;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      appliedCoupon: null,
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);
        let newItems = currentItems;

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity <= item.stock) {
            newItems = currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: newQuantity } : i
            );
          }
        } else {
          if (item.stock > 0) {
            newItems = [...currentItems, { ...item, quantity: 1 }];
          }
        }

        set({
          items: newItems,
          appliedCoupon: checkCouponValidity(newItems, get().appliedCoupon),
        });
      },
      removeItem: (id) => {
        const newItems = get().items.filter((item) => item.id !== id);
        set({
          items: newItems,
          appliedCoupon: checkCouponValidity(newItems, get().appliedCoupon),
        });
      },
      updateQuantity: (id, quantity) => {
        const currentItems = get().items;
        const item = currentItems.find((i) => i.id === id);
        if (item) {
          const clampedQuantity = Math.max(1, Math.min(quantity, item.stock));
          const newItems = currentItems.map((i) =>
            i.id === id ? { ...i, quantity: clampedQuantity } : i
          );
          set({
            items: newItems,
            appliedCoupon: checkCouponValidity(newItems, get().appliedCoupon),
          });
        }
      },
      clearCart: () => set({ items: [], appliedCoupon: null }),
      toggleWishlist: (productId) => {
        const currentWishlist = get().wishlist;
        const exists = currentWishlist.includes(productId);
        if (exists) {
          set({
            wishlist: currentWishlist.filter((id) => id !== productId),
          });
        } else {
          set({
            wishlist: [...currentWishlist, productId],
          });
        }
      },
      isInWishlist: (productId) => {
        return get().wishlist.includes(productId);
      },
    }),
    {
      name: 'kiddiq-cart-storage',
    }
  )
);

/**
 * Custom hook to safely load and consume Zustand state in Next.js App Router
 * to prevent hydration mismatches during server-side rendering.
 * 
 * @example
 * const items = useCartState((state) => state.items, []);
 */
export function useCartState<T>(selector: (state: CartStore) => T, fallback: T): T {
  const [isHydrated, setIsHydrated] = useState(false);
  const state = useCartStore(selector);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return isHydrated ? state : fallback;
}
