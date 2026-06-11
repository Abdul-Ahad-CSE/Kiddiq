"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, Phone, ShoppingCart, AlertCircle } from "lucide-react";
import { getOrdersByPhone, getCustomerOrders } from "@/app/actions/order-track";
import OrderListCard, { Order } from "@/components/OrderListCard";

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi mobile number"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

interface TrackOrderClientProps {
  isLoggedIn: boolean;
}

export default function TrackOrderClient({ isLoggedIn }: TrackOrderClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: phoneParam || "",
    },
  });

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        if (isLoggedIn) {
          const res = await getCustomerOrders();
          if (!active) return;
          if (res.success && res.orders) {
            setOrders(res.orders as Order[]);
          } else {
            setError(res.error || "Failed to retrieve your orders.");
          }
        } else if (phoneParam) {
          const res = await getOrdersByPhone(phoneParam);
          if (!active) return;
          if (res.success && res.orders) {
            setOrders(res.orders as Order[]);
          } else {
            setError(res.error || "Failed to locate orders matching this phone number.");
          }
        } else {
          setOrders([]);
        }
      } catch {
        if (!active) return;
        setError("An unexpected error occurred while fetching order information.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [isLoggedIn, phoneParam]);

  const onSubmit = (data: PhoneFormValues) => {
    router.push(`/track-order?phone=${encodeURIComponent(data.phone)}`);
  };

  // If user is logged in, display direct orders
  if (isLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
            Your Order History
          </h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">
            Here are the orders placed using your account.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" />
            <p className="text-sm text-slate-500 font-sans">Retrieving your orders...</p>
          </div>
        ) : error ? (
          <div className="flex gap-3 items-start p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-none mb-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] px-4">
            <ShoppingCart className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-extrabold text-slate-900 font-sans uppercase mb-2">
              No orders found
            </h3>
            <p className="text-sm text-slate-500 font-sans mb-6 max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Visit our shop to find premium educational toys and resources.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderListCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Guest search form and results
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 font-sans">
          Track Your Order
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-sans">
          Find and view your order details by entering your billing mobile number.
        </p>
      </div>

      {/* Guest Phone Search Form - Bypassed if logged in */}
      <div className="bg-white border border-slate-200 rounded-none p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2 font-sans">
              Billing Mobile Number
            </label>
            <div className="relative flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="phone"
                  type="text"
                  placeholder="e.g., 017XXXXXXXX or +8801XXXXXXXX"
                  {...register("phone")}
                  className={`block w-full h-12 pl-11 pr-4 border text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 rounded-none transition-all duration-200 font-sans ${
                    errors.phone ? "border-rose-500" : "border-slate-200"
                  }`}
                />
              </div>
              <button
                type="submit"
                className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200 px-6 shrink-0 flex items-center justify-center gap-2 select-none active:scale-[0.99] font-sans"
              >
                <Search className="h-4.5 w-4.5" />
                <span>Track Order</span>
              </button>
            </div>
            {errors.phone && (
              <p className="mt-2 text-xs font-bold text-rose-600 font-sans">{errors.phone.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Display Search Results */}
      {phoneParam && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900 font-sans">
              Search Results for: <span className="text-brand-blue">{phoneParam}</span>
            </h2>
            <Link
              href="/track-order"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase underline font-sans"
            >
              Clear Search
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-brand-blue mb-4" />
              <p className="text-sm text-slate-500 font-sans">Finding matching orders...</p>
            </div>
          ) : error ? (
            <div className="flex gap-3 items-start p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-none">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] px-4">
              <ShoppingCart className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-extrabold text-slate-900 font-sans uppercase mb-2">
                No orders found
              </h3>
              <p className="text-sm text-slate-500 font-sans mb-6 max-w-sm mx-auto">
                We couldn&apos;t find any orders matching this mobile number. Please check the number and try again.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderListCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
