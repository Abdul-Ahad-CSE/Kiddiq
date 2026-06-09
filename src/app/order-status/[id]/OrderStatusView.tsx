"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Check, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  ShoppingBag, 
  Phone, 
  Home,
  Truck,
  Package,
  ShieldCheck,
  PackageCheck
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FramerWrapper";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface OrderStatusViewProps {
  order: {
    id: string;
    userId: string | null;
    customerName: string;
    phone: string;
    email: string | null;
    district: string;
    area: string;
    fullAddress: string;
    items: unknown; // will typecast to OrderItem[]
    subtotal: number;
    deliveryCharge: number;
    paymentOption: string;
    paymentMethod: string;
    amountPaid: number;
    amountDueOnDelivery: number;
    senderNumber: string;
    transactionId: string;
    verificationStatus: "pending" | "verified" | "rejected";
    orderStatus: "pending_verification" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    adminNotes: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export default function OrderStatusView({ order }: OrderStatusViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const items = order.items as OrderItem[];

  // Calculate discount based on total stored elements
  const discount = useMemo(() => {
    return Math.max(0, order.subtotal + order.deliveryCharge - (order.amountPaid + order.amountDueOnDelivery));
  }, [order]);

  // Copy-to-Clipboard function
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Determine UI State: State A, State B, State C
  const isStateA = order.verificationStatus === "pending";
  const isStateC = order.verificationStatus === "rejected" || order.orderStatus === "cancelled";
  const isStateB = order.verificationStatus === "verified" && order.orderStatus !== "cancelled";

  // Pre-filled WhatsApp verify link for State A
  const whatsappVerifyUrl = useMemo(() => {
    const paymentOptionText = order.paymentOption === "COD" ? "Advance + COD" : "Full Advance";
    const addressInfo = `${order.fullAddress}, ${order.area}, ${order.district}`;
    const grandTotal = order.subtotal - discount + order.deliveryCharge;

    const message = `Hello Kiddiq! I have placed a new order. Please verify my payment:

📦 ORDER DETAILS:
- Order ID: ${order.id}
- Customer Name: ${order.customerName}
- Phone: ${order.phone}
- Delivery Address: ${addressInfo}

💰 BILLING:
- Order Total: ৳${grandTotal}
- Paid Now (Advance): ৳${order.amountPaid}
- Due on Delivery: ৳${order.amountDueOnDelivery}

💳 PAYMENT PROOF:
- Payment Option: ${paymentOptionText}
- Payment Method: ${order.paymentMethod}
- Sender Mobile: ${order.senderNumber}
- Transaction ID: ${order.transactionId}

Please confirm my order. Thank you!`;

    return `https://wa.me/8801825462039?text=${encodeURIComponent(message)}`;
  }, [order, discount]);

  // Pre-filled WhatsApp support link for State C
  const whatsappSupportUrl = useMemo(() => {
    const statusText = order.orderStatus === "cancelled" ? "cancelled" : "rejected";
    const message = `Hi Kiddiq, I have a question regarding my order status (ID: ${order.id}). It is showing as ${statusText}. Can you please help me check this?`;
    return `https://wa.me/8801825462039?text=${encodeURIComponent(message)}`;
  }, [order]);

  // Timeline Step calculation for State B
  // Steps: Placed -> Verified -> Processing -> Shipped -> Delivered
  const timelineSteps = useMemo(() => {
    const currentStatus = order.orderStatus;
    return [
      {
        id: "placed",
        label: "Order Placed",
        description: "Order registered in system",
        isCompleted: true,
        isActive: currentStatus === "pending_verification",
        icon: Package,
      },
      {
        id: "verified",
        label: "Payment Verified",
        description: "Payment checked & approved",
        isCompleted: true, // true because State B is only loaded if verificationStatus === 'verified'
        isActive: currentStatus === "confirmed",
        icon: ShieldCheck,
      },
      {
        id: "processing",
        label: "Processing",
        description: "Items packaging & handoff",
        isCompleted: ["processing", "shipped", "delivered"].includes(currentStatus),
        isActive: currentStatus === "processing",
        icon: Clock,
      },
      {
        id: "shipped",
        label: "Shipped",
        description: "In transit to destination",
        isCompleted: ["shipped", "delivered"].includes(currentStatus),
        isActive: currentStatus === "shipped",
        icon: Truck,
      },
      {
        id: "delivered",
        label: "Delivered",
        description: "Package received",
        isCompleted: currentStatus === "delivered",
        isActive: currentStatus === "delivered",
        icon: PackageCheck,
      },
    ];
  }, [order.orderStatus]);

  return (
    <StaggerContainer className="space-y-6 animate-fadeIn pb-16">
      {/* 1. STATE HEADERS */}

      {/* STATE A: PENDING VERIFICATION */}
      {isStateA && (
        <FadeIn className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center text-brand-yellow-dark shadow-inner animate-pulse">
            <Clock className="h-8 w-8 text-brand-yellow" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-brand-blue-dark font-sans tracking-tight">
              Order Registered — Pending Verification
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Thank you for ordering! Your checkout details are secure. You can send your payment verification proof to WhatsApp for confirming your order faster.
            </p>
          </div>

          {/* Copyable manual instructions info */}
          <div className="bg-amber-50/40 rounded-2xl border border-brand-yellow/20 p-5 sm:p-6 text-left space-y-4">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0 h-5 w-5 bg-brand-yellow-light text-brand-yellow-dark rounded-full flex items-center justify-center font-bold text-xs">
                i
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Manual Verification Instructions
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Send your payment proof transaction details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 flex justify-between items-center shadow-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Kiddiq Wallet Number
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 font-sans select-all">
                    01825462039
                  </span>
                </div>
                <button
                  onClick={() => handleCopy("01825462039", "wallet")}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
                  title="Copy Wallet Number"
                >
                  {copiedField === "wallet" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/60 p-3.5 flex justify-between items-center shadow-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Your Transaction ID
                  </span>
                  <span className="text-sm font-extrabold text-slate-800 font-sans uppercase select-all">
                    {order.transactionId}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(order.transactionId, "tx")}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
                  title="Copy Transaction ID"
                >
                  {copiedField === "tx" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {copiedField && (
              <p className="text-[11px] text-emerald-700 font-bold text-center">
                ✓ {copiedField === "wallet" ? "Wallet number" : "Transaction ID"} copied to clipboard!
              </p>
            )}
          </div>

          <div className="pt-2">
            <a
              href={whatsappVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-6 flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all duration-300 hover:scale-102 cursor-pointer"
            >
              <MessageSquare className="h-5.5 w-5.5 fill-current" />
              Verify via WhatsApp Now
            </a>
          </div>
        </FadeIn>
      )}

      {/* STATE B: TIMELINE SUCCESS TRACKING */}
      {isStateB && (
        <FadeIn className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-lg space-y-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left border-b border-slate-100 pb-6">
            <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-brand-blue-dark tracking-tight font-sans">
                Payment Verified & Confirmed
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                We verified your payment. Your child&apos;s development items are moving through our packaging and delivery stages.
              </p>
            </div>
          </div>

          {/* Timeline tracking progress bar */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Delivery Tracking Timeline
            </h3>

            {/* Desktop Horizontal Timeline (md+) */}
            <div className="hidden md:flex justify-between items-start relative pt-4 pb-2">
              {/* Progress Connector Line */}
              <div className="absolute top-10 left-12 right-12 h-1 bg-slate-100 z-0">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      timelineSteps.filter(s => s.isCompleted).length === 5 ? 100 :
                      timelineSteps.filter(s => s.isCompleted).length === 4 ? 75 :
                      timelineSteps.filter(s => s.isCompleted).length === 3 ? 50 :
                      timelineSteps.filter(s => s.isCompleted).length === 2 ? 25 : 0
                    }%`
                  }}
                />
              </div>

              {timelineSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center relative z-10 w-32">
                    <div 
                      className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        step.isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                          : step.isActive 
                          ? "bg-white border-brand-yellow text-brand-yellow-dark shadow-sm"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-extrabold mt-3 ${step.isActive ? "text-brand-blue-dark" : step.isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 max-w-[110px] leading-tight">
                      {step.description}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Timeline (<md) */}
            <div className="md:hidden flex flex-col gap-6 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Active Progress line highlight */}
              <div 
                className="absolute left-2 top-2 bg-emerald-500 w-0.5 transition-all duration-500 ease-out"
                style={{
                  height: `${
                    timelineSteps.filter(s => s.isCompleted).length === 5 ? 95 :
                    timelineSteps.filter(s => s.isCompleted).length === 4 ? 74 :
                    timelineSteps.filter(s => s.isCompleted).length === 3 ? 50 :
                    timelineSteps.filter(s => s.isCompleted).length === 2 ? 24 : 0
                  }%`
                }}
              />

              {timelineSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex items-start gap-4 relative">
                    <div 
                      className={`h-9 w-9 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${
                        step.isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                          : step.isActive 
                          ? "bg-white border-brand-yellow text-brand-yellow-dark"
                          : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      <StepIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-extrabold ${step.isActive ? "text-brand-blue-dark" : step.isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* STATE C: REJECTED / CANCELLED */}
      {isStateC && (
        <FadeIn className="w-full bg-white border border-rose-100 rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 shadow-inner">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-rose-700 tracking-tight font-sans">
                {order.orderStatus === "cancelled" ? "Order Cancelled" : "Verification Rejected"}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {order.orderStatus === "cancelled"
                  ? "This order was cancelled and stock has been restored to the catalog."
                  : "Manual payment verification could not be completed for this transaction."}
              </p>
            </div>
          </div>

          {/* Admin Rejection Notes */}
          {order.adminNotes && (
            <div className="bg-rose-50/40 rounded-2xl border border-rose-200 p-5 text-left space-y-2.5">
              <span className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                Support Comments / Rejection Reason
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {order.adminNotes}
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] px-6 flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
            >
              <MessageSquare className="h-5 w-5" />
              Support via WhatsApp
            </a>
            <a
              href="tel:+8801825462039"
              className="min-h-[48px] px-6 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
            >
              <Phone className="h-5 w-5 text-slate-500" />
              Call Customer Service
            </a>
          </div>
        </FadeIn>
      )}


      {/* 2. ORDER DETAILS & ITEMS BREAKDOWN (Common to all states) */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Items Breakdown Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-extrabold text-brand-blue-dark font-sans tracking-tight border-b border-slate-100 pb-4">
            Items Ordered
          </h2>

          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800 leading-snug">
                    {item.title}
                  </h4>
                  <span className="inline-block text-xs font-semibold text-slate-400">
                    ৳{item.price} × {item.quantity}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-slate-700 font-sans whitespace-nowrap">
                  ৳{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Billing Summary & Invoice Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-brand-blue-dark font-sans tracking-tight">
              Order Details
            </h2>
            <button
              onClick={() => handleCopy(order.id, "orderId")}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest border border-slate-200/60 hover:bg-slate-50 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
            >
              {copiedField === "orderId" ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy ID
                </>
              )}
            </button>
          </div>

          {/* Customer Metadata fields */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Customer Name
              </span>
              <span className="font-extrabold text-slate-700">
                {order.customerName}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Phone Number
              </span>
              <span className="font-extrabold text-slate-700 font-sans">
                {order.phone}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Delivery Address
              </span>
              <span className="font-extrabold text-slate-700 line-clamp-2">
                {order.fullAddress}, {order.area}, {order.district}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Payment Option
              </span>
              <span className="font-extrabold text-slate-700">
                {order.paymentOption === "COD" ? "Advance + COD" : "Full Advance"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Payment Method
              </span>
              <span className="font-extrabold text-slate-700 font-sans">
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Financial Breakdown calculations */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700 font-sans">
                ৳{order.subtotal}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Promo Discount</span>
                <span className="font-extrabold font-sans">
                  -৳{discount}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Delivery Charge</span>
              <span className="font-semibold text-slate-700 font-sans">
                ৳{order.deliveryCharge}
              </span>
            </div>

            <div className="border-t border-dashed border-slate-200/80 my-2" />

            <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
              <span>Paid Now (Advance)</span>
              <span className="font-extrabold font-sans text-sm">
                ৳{order.amountPaid}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 font-semibold p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span>Due on Delivery</span>
              <span className="font-bold font-sans text-slate-800 text-sm">
                ৳{order.amountDueOnDelivery}
              </span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-1">
              <span>Grand Total</span>
              <span className="text-base font-extrabold text-brand-blue-dark font-sans">
                ৳{order.subtotal - discount + order.deliveryCharge}
              </span>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* 3. RETURN TO SHOP (Bottom navigation bar) */}
      <FadeIn className="pt-4 flex flex-col sm:flex-row gap-3">
        <Link
          href="/shop"
          className="flex-1 min-h-[48px] px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" />
          Go back to Catalog
        </Link>
        <Link
          href="/"
          className="flex-1 min-h-[48px] px-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="h-4 w-4" />
          Return to Homepage
        </Link>
      </FadeIn>
    </StaggerContainer>
  );
}
