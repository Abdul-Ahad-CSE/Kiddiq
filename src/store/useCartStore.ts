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
}

interface CartStore {
  items: CartItem[];
  wishlist: string[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + 1;
          if (newQuantity <= item.stock) {
            set({
              items: currentItems.map((i) =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
              ),
            });
          }
        } else {
          if (item.stock > 0) {
            set({
              items: [...currentItems, { ...item, quantity: 1 }],
            });
          }
        }
      },
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },
      updateQuantity: (id, quantity) => {
        const currentItems = get().items;
        const item = currentItems.find((i) => i.id === id);
        if (item) {
          const clampedQuantity = Math.max(1, Math.min(quantity, item.stock));
          set({
            items: currentItems.map((i) =>
              i.id === id ? { ...i, quantity: clampedQuantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
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
