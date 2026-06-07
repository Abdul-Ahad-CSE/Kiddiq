"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Info, Trash2, AlertTriangle } from "lucide-react";
import { useCartStore, useCartState } from "@/store/useCartStore";
import { checkoutSchema, CheckoutFormInput } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";

// List of all 64 districts in Bangladesh, sorted alphabetically with Chattogram and Dhaka pinned at the top
const BANGLADESH_DISTRICTS = [
  "Chattogram",
  "Dhaka",
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chuadanga",
  "Comilla",
  "Cox's Bazar",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jaipurhat",
  "Jamalpur",
  "Jessore",
  "Jhalokati",
  "Jhenaidah",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon"
];

interface CheckoutClientProps {
  chattogramAreas: string[];
}

export default function CheckoutClient({ chattogramAreas }: CheckoutClientProps) {
  const cartItems = useCartState((state) => state.items, []);
  const [isOtherArea, setIsOtherArea] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");

  // Cart actions from Zustand store
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange"
  });

  const watchedDistrict = useWatch({ control, name: "district" });
  const watchedArea = useWatch({ control, name: "area" });

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  // Promo Code Discount Calculation (10% off using KIDDIQ10)
  const discount = useMemo(() => {
    if (appliedPromo === "KIDDIQ10") {
      return Math.round(subtotal * 0.1);
    }
    return 0;
  }, [appliedPromo, subtotal]);

  // Real-time Delivery Charge Calculation
  const deliveryCharge = useMemo(() => {
    if (!watchedDistrict || !watchedArea) return 0;
    
    if (watchedDistrict === "Chattogram") {
      // If the area selected is one of the seeded city areas (60 BDT)
      if (chattogramAreas.includes(watchedArea)) {
        return 60;
      }
      // If it's a sub-district/upazila or marked as "Other", it falls back to nationwide (120 BDT)
      return 120;
    }
    
    // Default nationwide rate
    return 120;
  }, [watchedDistrict, watchedArea, chattogramAreas]);

  // Grand Total Calculation
  const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);

  // Area Selection Handler
  const handleAreaSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsOtherArea(true);
      setValue("area", "", { shouldValidate: true });
    } else {
      setIsOtherArea(false);
      setValue("area", val, { shouldValidate: true });
    }
  };

  const onSubmit = (data: CheckoutFormInput) => {
    console.log("Validated Form Data:", data);
    alert(`Order details validated successfully!\n\nSubtotal: ৳${subtotal}\nDiscount: -৳${discount}\nDelivery Charge: ৳${deliveryCharge}\nGrand Total: ৳${grandTotal}`);
  };

  // Guard: Cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-3xl text-center shadow-xs">
        <div className="rounded-full bg-slate-50 p-4 mb-4">
          <ShoppingBag className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Your cart is empty
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          Add some premium educational toys or parenting guides before checking out.
        </p>
        <Link
          href="/shop"
          className="min-h-[44px] px-6 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center"
        >
          Go to Shop Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 items-start pb-16">
      
      {/* Column 1: Shipping Details Form (takes 7 or 8 columns on desktop) */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full lg:col-span-7 xl:col-span-8 bg-white p-5 sm:p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-extrabold text-brand-blue-dark font-sans">
            Shipping Information
          </h2>
          <p className="text-xs text-slate-400">
            All fields are required. Please verify your contact details.
          </p>
        </div>

        {/* Name Input */}
        <div>
          <label htmlFor="customerName" className="text-sm font-bold text-slate-700 block mb-2">
            Full Name
          </label>
          <input
            id="customerName"
            type="text"
            placeholder="Enter your full name"
            {...register("customerName")}
            className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
              errors.customerName
                ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
            }`}
          />
          {errors.customerName && (
            <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.customerName.message}</p>
          )}
        </div>

        {/* Contact Group (Phone + Email) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="text-sm font-bold text-slate-700 block mb-2">
              Mobile Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g., 01825462039"
              {...register("phone")}
              className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
                errors.phone
                  ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                  : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
              }`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="text-sm font-bold text-slate-700 block mb-2">
              Email Address (Optional)
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
                errors.email
                  ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                  : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Location Group (District + Area) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* District Select */}
          <div>
            <label htmlFor="district" className="text-sm font-bold text-slate-700 block mb-2">
              District
            </label>
            <select
              id="district"
              {...register("district", {
                onChange: () => {
                  setValue("area", "");
                  setIsOtherArea(false);
                }
              })}
              className={`w-full min-h-[44px] rounded-xl border px-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 cursor-pointer ${
                errors.district
                  ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                  : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
              }`}
            >
              <option value="">Select District...</option>
              {BANGLADESH_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.district.message}</p>
            )}
          </div>

          {/* Area Field (Dropdown if Chattogram, else Text input) */}
          <div>
            <label htmlFor="area" className="text-sm font-bold text-slate-700 block mb-2">
              Area / Thana / Upazila
            </label>
            
            {watchedDistrict === "Chattogram" ? (
              <div className="space-y-3">
                <select
                  id="area-select"
                  onChange={handleAreaSelectChange}
                  value={isOtherArea ? "Other" : watchedArea || ""}
                  className={`w-full min-h-[44px] rounded-xl border px-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 cursor-pointer ${
                    errors.area
                      ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                      : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                  }`}
                >
                  <option value="">Select Area...</option>
                  {chattogramAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  <option value="Other">Other (Outside Chattogram City / Upazila)</option>
                </select>

                {/* Secondary Text Input for Upazilas outside Chattogram City */}
                {isOtherArea && (
                  <input
                    type="text"
                    placeholder="Enter Thana / Upazila name"
                    onChange={(e) => setValue("area", e.target.value, { shouldValidate: true })}
                    className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
                      errors.area
                        ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                        : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                    }`}
                  />
                )}
              </div>
            ) : (
              <input
                id="area"
                type="text"
                placeholder={watchedDistrict ? "Enter Thana / Upazila name" : "Select district first"}
                disabled={!watchedDistrict}
                {...register("area")}
                className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
                  errors.area
                    ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                    : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                }`}
              />
            )}
            
            {errors.area && (
              <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.area.message}</p>
            )}
          </div>
        </div>

        {/* Address Input */}
        <div>
          <label htmlFor="fullAddress" className="text-sm font-bold text-slate-700 block mb-2">
            Street Address / House & Road Number
          </label>
          <textarea
            id="fullAddress"
            rows={3}
            placeholder="Enter your detailed delivery address..."
            {...register("fullAddress")}
            className={`w-full rounded-xl border p-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 resize-none ${
              errors.fullAddress
                ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
            }`}
          />
          {errors.fullAddress && (
            <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.fullAddress.message}</p>
          )}
        </div>

        {/* Phase 5 Placeholder UI elements (Payment options placeholder) */}
        <div className="border-t border-slate-100 pt-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/40 p-4 flex gap-3 text-slate-500">
            <Info className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-slate-700 block">Next Steps</span>
              <p className="leading-relaxed">
                Form validation is active. In the next phase, we will configure order submissions, WhatsApp integrations, and local payment verification (bKash/Nagad).
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-brand-yellow hover:bg-brand-yellow-dark text-brand-blue-dark font-extrabold text-sm shadow-md transition-all duration-300 active:scale-98 cursor-pointer"
        >
          Proceed to Order Submission
        </button>
      </form>

      {/* Column 2: Cart Items & Order Summary (takes 4 or 5 columns on desktop, sticky layout) */}
      <aside className="w-full lg:col-span-5 xl:col-span-4 mt-8 lg:mt-0 sticky top-28 self-start space-y-6">
        
        {/* Order Summary Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h2 className="text-base font-extrabold text-brand-blue-dark mb-4 font-sans">
            Order Summary
          </h2>

          {/* Cart Items List */}
          <motion.div layout className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 mb-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                  className="py-3.5 flex gap-3 items-start justify-between"
                >
                  {/* Left: Product Image */}
                  <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  {/* Center: Details, Quantity controls & Delete */}
                  <div className="flex-1 min-w-0 px-2 space-y-1">
                    <span className="block text-sm font-bold text-slate-800 truncate">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease Quantity"
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs font-extrabold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-[11px] font-extrabold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase Quantity"
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs font-extrabold"
                        >
                          +
                        </button>
                      </div>

                      {/* Trash button */}
                      <button
                        type="button"
                        onClick={() => setItemToDelete({ id: item.id, title: item.title })}
                        aria-label="Remove Item"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer animate-duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* Right: Subtotal Price */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-brand-blue-dark block">
                      ৳{item.price * item.quantity}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ৳{item.price} each
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Promo Code Input */}
          <div className="border-t border-slate-100 pt-4 pb-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Promo Code (e.g. KIDDIQ10)"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError("");
                }}
                disabled={!!appliedPromo}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-hidden transition-all text-slate-800 disabled:opacity-60 uppercase"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedPromo(null);
                    setPromoInput("");
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (promoInput.trim() === "KIDDIQ10") {
                      setAppliedPromo("KIDDIQ10");
                      setPromoError("");
                    } else if (promoInput.trim() === "") {
                      setPromoError("Please enter a code");
                    } else {
                      setPromoError("Invalid promo code");
                    }
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
            {promoError && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-500">{promoError}</p>
            )}
            {appliedPromo && (
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">Promo code KIDDIQ10 applied (10% off)!</p>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Cart Subtotal</span>
              <span className="font-bold text-slate-800">৳{subtotal}</span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500">Discount</span>
                <span className="font-bold text-rose-500">-৳{discount}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Delivery Charge</span>
              <span className="font-bold text-slate-800">
                {deliveryCharge > 0 ? (
                  <span className="flex flex-col items-end">
                    <span>৳{deliveryCharge}</span>
                    {watchedDistrict === "Chattogram" && deliveryCharge === 60 && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                        Chattogram City Rate
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic font-medium">Select location first</span>
                )}
              </span>
            </div>

            {/* Grand Total */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="font-extrabold text-slate-800 font-sans">Grand Total</span>
              <span className="text-xl font-extrabold text-brand-blue-dark font-sans">
                ৳{grandTotal}
              </span>
            </div>
          </div>
        </div>
        
      </aside>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="flex gap-3 items-start">
                <div className="rounded-full bg-rose-50 p-3 shrink-0 animate-pulse">
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800 font-sans">
                    Remove Item?
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to remove <strong className="text-slate-800">{itemToDelete.title}</strong> from your cart?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(itemToDelete.id);
                    setItemToDelete(null);
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
