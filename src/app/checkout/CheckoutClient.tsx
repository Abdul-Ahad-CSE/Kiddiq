"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Trash2, AlertTriangle } from "lucide-react";
import { useCartStore, useCartState, getCartSubtotal, getStandardSubtotal } from "@/store/useCartStore";
import { checkoutSchema, CheckoutFormInput } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { createOrder } from "@/app/actions/order";
import { useRouter } from "next/navigation";
import { validateCouponCode } from "@/app/actions/admin-coupons";

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
  userProfile?: {
    name: string;
    email: string;
    phone: string | null;
    district: string | null;
    area: string | null;
    fullAddress: string | null;
  } | null;
}

export default function CheckoutClient({ chattogramAreas, userProfile }: CheckoutClientProps) {
  const router = useRouter();
  const cartItems = useCartState((state) => state.items, []);
  const [isOtherArea, setIsOtherArea] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Subtotal Calculation (declared early to resolve dependency order for compilers/static-analysis)
  const subtotal = useMemo(() => {
    return getCartSubtotal(cartItems);
  }, [cartItems]);

  const standardSubtotal = useMemo(() => {
    return getStandardSubtotal(cartItems);
  }, [cartItems]);

  const preorderAdvanceSubtotal = useMemo(() => {
    return cartItems
      .filter((item) => item.isPreorder)
      .reduce((acc, item) => {
        const advancePercent = item.preorderAdvancePercent ?? 50;
        return acc + (item.price * (advancePercent / 100)) * item.quantity;
      }, 0);
  }, [cartItems]);

  const preorderRemainingSubtotal = useMemo(() => {
    return cartItems
      .filter((item) => item.isPreorder)
      .reduce((acc, item) => {
        const advancePercent = item.preorderAdvancePercent ?? 50;
        return acc + (item.price * (1 - advancePercent / 100)) * item.quantity;
      }, 0);
  }, [cartItems]);

  const hasOnlyPreorders = useMemo(() => {
    return cartItems.length > 0 && cartItems.every((item) => item.isPreorder);
  }, [cartItems]);

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [wasCouponAutoRemoved, setWasCouponAutoRemoved] = useState(false);
  const [isApplyingPromo, startPromoTransition] = useTransition();

  // Read appliedCoupon and applyCoupon from Zustand store
  const appliedCoupon = useCartState((state) => state.appliedCoupon, null);
  const applyCoupon = useCartStore((state) => state.applyCoupon);

  // Clear promo code automatically if cart is 100% preorder items
  useEffect(() => {
    if (hasOnlyPreorders && (appliedCoupon || promoInput)) {
      applyCoupon(null);
      const timer = setTimeout(() => {
        setPromoInput("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hasOnlyPreorders, appliedCoupon, promoInput, applyCoupon]);

  // Synchronize promoInput and check for auto-removal via safe async ticks
  useEffect(() => {
    if (appliedCoupon) {
      const activeCode = appliedCoupon.code;
      const timer = setTimeout(() => {
        setPromoInput(activeCode);
        setWasCouponAutoRemoved(false);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setPromoInput((prev) => {
          if (prev) {
            setWasCouponAutoRemoved(true);
          }
          return "";
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [appliedCoupon]);

  const handleApplyPromo = () => {
    const trimmed = promoInput.trim().toUpperCase();
    if (!trimmed) {
      setPromoError("Please enter a code");
      return;
    }
    setPromoError("");
    setWasCouponAutoRemoved(false);

    startPromoTransition(async () => {
      const res = await validateCouponCode(trimmed, standardSubtotal);
      if (res.success && res.coupon) {
        applyCoupon(res.coupon);
        setPromoError("");
      } else {
        setPromoError(res.error || "Invalid promo code");
      }
    });
  };

  // Cart actions from Zustand store
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

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

  useEffect(() => {
    if (userProfile) {
      if (userProfile.name) setValue("customerName", userProfile.name);
      if (userProfile.email) setValue("email", userProfile.email);
      if (userProfile.phone) setValue("phone", userProfile.phone);
      if (userProfile.district) setValue("district", userProfile.district);
      if (userProfile.area) {
        if (userProfile.district === "Chattogram" && !chattogramAreas.includes(userProfile.area)) {
          setTimeout(() => setIsOtherArea(true), 0);
        }
        setValue("area", userProfile.area);
      }
      if (userProfile.fullAddress) setValue("fullAddress", userProfile.fullAddress);
    }
  }, [userProfile, setValue, chattogramAreas]);

  const watchedDistrict = useWatch({ control, name: "district" });
  const watchedArea = useWatch({ control, name: "area" });
  const watchedPaymentOption = useWatch({ control, name: "paymentOption" });
  const watchedPaymentMethod = useWatch({ control, name: "paymentMethod" });

  // Promo Code Discount Calculation
  const discount = useMemo(() => {
    if (appliedCoupon) {
      return Math.round(standardSubtotal * (appliedCoupon.discountPercent / 100));
    }
    return 0;
  }, [appliedCoupon, standardSubtotal]);

  // Real-time Delivery Charge Calculation
  const deliveryCharge = useMemo(() => {
    if (hasOnlyPreorders) return 0;
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
  }, [watchedDistrict, watchedArea, chattogramAreas, hasOnlyPreorders]);

  // Grand Total Calculation
  const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);

  // Hybrid Split Calculations
  const { paidNow, dueOnDelivery } = useMemo(() => {
    if (!watchedPaymentOption) {
      return { paidNow: 0, dueOnDelivery: 0 };
    }
    if (watchedPaymentOption === "cod") {
      return {
        paidNow: preorderAdvanceSubtotal + deliveryCharge,
        dueOnDelivery: Math.max(0, preorderRemainingSubtotal + standardSubtotal - discount),
      };
    }
    // "full"
    return {
      paidNow: grandTotal,
      dueOnDelivery: preorderRemainingSubtotal,
    };
  }, [watchedPaymentOption, deliveryCharge, preorderAdvanceSubtotal, preorderRemainingSubtotal, standardSubtotal, discount, grandTotal]);

  const whatsappBypassUrl = useMemo(() => {
    if (cartItems.length === 0) return "#";

    const itemsList = cartItems
      .map(item => {
        if (item.isPreorder) {
          const advancePercent = item.preorderAdvancePercent ?? 50;
          const advPrice = item.price * (advancePercent / 100);
          return `  - [Pre-order] ${item.quantity}x ${item.title} (Advance: ৳${advPrice * item.quantity}, Full: ৳${item.price * item.quantity})`;
        }
        return `  - ${item.quantity}x ${item.title} (Price: ৳${item.price * item.quantity})`;
      })
      .join("\n");

    const totalAmount = Math.max(0, subtotal - discount);

    const message = `Hi Kiddiq, I would like to order:\n${itemsList}\n\nTotal paid now/advance: ৳${totalAmount}\n\nPlease guide me through the next steps for delivery!`;

    return `https://wa.me/8801825462039?text=${encodeURIComponent(message)}`;
  }, [cartItems, subtotal, discount]);

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

  const onSubmit = async (data: CheckoutFormInput) => {
    setIsPending(true);
    setSubmitError(null);
    try {
      const res = await createOrder(data, cartItems, appliedCoupon ? appliedCoupon.code : null);
      if (res.success && res.orderId) {
        clearCart();
        router.push("/order-status/" + res.orderId);
      } else {
        setSubmitError(res.message || "Something went wrong while submitting your order.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to submit your order. Please try again.");
    } finally {
      setIsPending(false);
    }
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
        className="w-full lg:col-span-7 xl:col-span-8 bg-white p-5 sm:p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs"
      >
        <fieldset className="space-y-6" disabled={isPending}>
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

        {/* Save Address Checkbox */}
        {userProfile && (
          <div className="flex items-center gap-3 mt-4 select-none">
            <input
              id="saveAddress"
              type="checkbox"
              defaultChecked
              {...register("saveAddress")}
              className="h-5 w-5 rounded-md border-slate-200 text-brand-blue focus:ring-brand-blue/20 cursor-pointer"
            />
            <label htmlFor="saveAddress" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Save this address to my profile for future orders
            </label>
          </div>
        )}

        {/* Payment Plan Selector */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Select Payment Option</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: COD */}
            <label
              className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 min-h-[96px] ${
                watchedPaymentOption === "cod"
                  ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50"
              }`}
            >
              <input
                type="radio"
                value="cod"
                {...register("paymentOption")}
                className="sr-only"
              />
              <div className="flex justify-between items-start">
                <span className="text-sm font-extrabold text-slate-800">Advance + COD</span>
                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                  watchedPaymentOption === "cod"
                    ? "border-brand-blue bg-brand-blue"
                    : "border-slate-300 bg-white"
                }`}>
                  {watchedPaymentOption === "cod" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 leading-relaxed">
                {preorderAdvanceSubtotal > 0 ? (
                  `Pay preorder advance (৳${preorderAdvanceSubtotal}) + delivery charge now (৳${deliveryCharge}), pay the rest on delivery.`
                ) : (
                  `Pay delivery charge now (৳${deliveryCharge}), pay the rest on delivery.`
                )}
              </div>
            </label>

            {/* Option 2: Full Payment */}
            <label
              className={`flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 min-h-[96px] ${
                watchedPaymentOption === "full"
                  ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50"
              }`}
            >
              <input
                type="radio"
                value="full"
                {...register("paymentOption")}
                className="sr-only"
              />
              <div className="flex justify-between items-start">
                <span className="text-sm font-extrabold text-slate-800">Full Advance</span>
                <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                  watchedPaymentOption === "full"
                    ? "border-brand-blue bg-brand-blue"
                    : "border-slate-300 bg-white"
                }`}>
                  {watchedPaymentOption === "full" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500 leading-relaxed">
                {preorderRemainingSubtotal > 0 ? (
                  `Pay ৳${grandTotal} now (preorder advance + standard items + delivery fee), and pay the remaining preorder balance (৳${preorderRemainingSubtotal}) on delivery.`
                ) : (
                  `Pay full amount now (৳${grandTotal}) and receive your order hassle-free.`
                )}
              </div>
            </label>
          </div>
          {errors.paymentOption && (
            <p className="mt-1 text-xs font-semibold text-rose-500">{errors.paymentOption.message}</p>
          )}
        </div>

        {/* Payment Instructions Card */}
        {watchedPaymentOption && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Payment Instructions
              </span>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
                Manual Transfer
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500 font-medium">Transfer Amount:</span>
                <span className="text-lg font-extrabold text-brand-blue-dark">
                  ৳{paidNow}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200/60">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                    bKash / Nagad Personal Number
                  </span>
                  <span className="text-sm font-extrabold text-slate-800">
                    01825462039
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("01825462039");
                    alert("Payment phone number copied to clipboard!");
                  }}
                  className="min-h-[44px] px-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Copy Number
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2 pt-1">
                <span className="font-extrabold text-slate-700 block">How to make payment:</span>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>Open your bKash or Nagad mobile banking application.</li>
                  <li>Choose the <strong className="text-slate-800">Send Money</strong> option.</li>
                  <li>Enter our Personal Number: <strong className="text-slate-800">01825462039</strong>.</li>
                  <li>Enter the exact amount: <strong className="text-slate-800 font-sans">৳{paidNow}</strong>.</li>
                  <li>Complete the transaction and copy the <strong className="text-slate-800">Transaction ID (TrxID)</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Verification Proof Fields */}
        {watchedPaymentOption && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* bKash Toggle Card */}
                <label
                  className={`flex items-center justify-center min-h-[48px] rounded-xl border cursor-pointer font-bold text-sm transition-all ${
                    watchedPaymentMethod === "bkash"
                      ? "border-emerald-600 bg-emerald-50/45 text-emerald-700 ring-1 ring-emerald-600"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    value="bkash"
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  bKash
                </label>

                {/* Nagad Toggle Card */}
                <label
                  className={`flex items-center justify-center min-h-[48px] rounded-xl border cursor-pointer font-bold text-sm transition-all ${
                    watchedPaymentMethod === "nagad"
                      ? "border-emerald-600 bg-emerald-50/45 text-emerald-700 ring-1 ring-emerald-600"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    value="nagad"
                    {...register("paymentMethod")}
                    className="sr-only"
                  />
                  Nagad
                </label>
              </div>
              {errors.paymentMethod && (
                <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.paymentMethod.message}</p>
              )}
            </div>

            {/* Sender Phone & Transaction ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender Phone Number */}
              <div>
                <label htmlFor="senderNumber" className="text-sm font-bold text-slate-700 block mb-2">
                  Sender Mobile Number
                </label>
                <input
                  id="senderNumber"
                  type="tel"
                  placeholder="e.g., 01825462039"
                  {...register("senderNumber")}
                  className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 ${
                    errors.senderNumber
                      ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                      : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                  }`}
                />
                {errors.senderNumber && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.senderNumber.message}</p>
                )}
              </div>

              {/* Transaction ID */}
              <div>
                <label htmlFor="transactionId" className="text-sm font-bold text-slate-700 block mb-2">
                  Transaction ID (TrxID)
                </label>
                <input
                  id="transactionId"
                  type="text"
                  placeholder="e.g., 8HG7F5D3"
                  {...register("transactionId")}
                  className={`w-full min-h-[44px] rounded-xl border px-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 outline-hidden transition-all text-slate-800 uppercase ${
                    errors.transactionId
                      ? "border-rose-300 focus:ring-rose-200/45 focus:border-rose-500"
                      : "border-slate-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                  }`}
                />
                {errors.transactionId && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.transactionId.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

          {submitError && (
            <div className="flex gap-2.5 items-start p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold animate-fadeIn">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full min-h-[48px] flex items-center justify-center rounded-xl bg-brand-yellow hover:bg-brand-yellow-dark text-brand-blue-dark font-extrabold text-sm shadow-md transition-all duration-300 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-brand-blue-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Order...
              </span>
            ) : (
              "Proceed to Order Submission"
            )}
          </button>

          {/* WhatsApp Bypass CTA */}
          <a
            href={cartItems.length === 0 ? "#" : whatsappBypassUrl}
            target={cartItems.length === 0 ? undefined : "_blank"}
            rel={cartItems.length === 0 ? undefined : "noopener noreferrer"}
            className={`w-full min-h-[48px] mt-3 flex items-center justify-center gap-2.5 rounded-xl border font-extrabold text-sm transition-all duration-300 active:scale-98 ${
              cartItems.length === 0
                ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed pointer-events-none"
                : "border-emerald-600 bg-white hover:bg-emerald-50/20 text-emerald-700 cursor-pointer shadow-xs"
            }`}
          >
            {/* WhatsApp Icon */}
            <svg
              className="h-5 w-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.57 1.973 14.1 1.95 12.01 1.95c-5.437 0-9.862 4.371-9.866 9.8.002 1.914.536 3.784 1.547 5.45l-.993 3.626 3.738-.97c1.554.85 3.123 1.298 4.62 1.298zm11.304-7.467c-.301-.15-1.78-.879-2.056-.979-.275-.1-.475-.15-.675.15-.199.299-.775.979-.95 1.178-.175.199-.35.224-.65.075-1.282-.64-2.146-1.127-3.003-2.601-.225-.387.225-.359.643-1.199.075-.149.038-.28-.019-.379-.056-.1-.475-1.149-.65-1.57-.175-.421-.369-.363-.506-.37-.13-.006-.28-.008-.43-.008-.15 0-.395.056-.6.28-.205.224-.78.761-.78 1.854 0 1.093.794 2.147.904 2.296.11.15 1.56 2.38 3.78 3.34 1.275.55 2.018.6 2.74.49.522-.08 1.6-1.076 1.825-2.126.225-1.05.225-1.95.15-2.126-.075-.175-.275-.275-.575-.425z" />
            </svg>
            Or order via WhatsApp
          </a>
        </fieldset>
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

                    {item.isPreorder && (
                      <div className="my-1.5 space-y-1">
                        <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          Pre-order Advance ({item.preorderAdvancePercent ?? 50}%)
                        </span>
                        {item.preorderETA && (
                          <span className="block text-[10px] text-slate-500 font-medium">
                            ETA: {item.preorderETA}
                          </span>
                        )}
                        <span className="block text-[10px] text-amber-600 font-medium leading-tight">
                          Requires advance payment. Remaining amount due on delivery.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isPending}
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
                          disabled={item.quantity >= item.stock || isPending}
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
                        disabled={isPending}
                        aria-label="Remove Item"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer animate-duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {/* Right: Subtotal Price */}
                  <div className="text-right shrink-0">
                    {item.isPreorder ? (
                      <>
                        <span className="text-sm font-extrabold text-brand-blue-dark block">
                          ৳{((item.price * ((item.preorderAdvancePercent ?? 50) / 100)) * item.quantity).toLocaleString("en-BD")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium line-through block">
                          ৳{(item.price * item.quantity).toLocaleString("en-BD")} (Full Price)
                        </span>
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          ৳{(item.price * ((item.preorderAdvancePercent ?? 50) / 100)).toLocaleString("en-BD")} each (Advance)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-extrabold text-brand-blue-dark block">
                          ৳{(item.price * item.quantity).toLocaleString("en-BD")}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ৳{item.price.toLocaleString("en-BD")} each
                        </span>
                      </>
                    )}
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
                placeholder="Promo Code (e.g. KIDDIQ15)"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError("");
                  setWasCouponAutoRemoved(false);
                }}
                disabled={!!appliedCoupon || isPending || isApplyingPromo || hasOnlyPreorders}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-hidden transition-all text-slate-800 disabled:opacity-60 uppercase"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    applyCoupon(null);
                    setPromoInput("");
                    setPromoError("");
                    setWasCouponAutoRemoved(false);
                  }}
                  disabled={isPending || isApplyingPromo}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={isPending || isApplyingPromo || hasOnlyPreorders}
                  className="min-h-[44px] px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                >
                  {isApplyingPromo ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Apply"
                  )}
                </button>
              )}
            </div>
            {hasOnlyPreorders && (
              <p className="mt-1.5 text-[11px] font-bold text-amber-600">
                Promo codes cannot be applied to orders containing only pre-order items.
              </p>
            )}
            {promoError && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-500">{promoError}</p>
            )}
            {appliedCoupon && (
              <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                Promo code {appliedCoupon.code} applied ({appliedCoupon.discountPercent}% off)!
              </p>
            )}
            {wasCouponAutoRemoved && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-500 leading-snug">
                Coupon removed: Cart subtotal fell below the required minimum.
              </p>
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

            {/* Hybrid splits details */}
            {watchedPaymentOption ? (
              <>
                {/* Paid Now */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-600">Paid Now (Bkash/Nagad)</span>
                  <span className="font-extrabold text-emerald-700">
                    ৳{paidNow}
                  </span>
                </div>

                {/* Due on Delivery */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-500">Due on Delivery</span>
                  <span className="font-bold text-slate-800">
                    ৳{dueOnDelivery}
                  </span>
                </div>
              </>
            ) : (
              <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-400 font-medium italic">
                Select a payment option to view hybrid split details
              </div>
            )}
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
