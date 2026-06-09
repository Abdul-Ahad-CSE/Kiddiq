import React from "react";
import prisma from "@/lib/db";
import OrderStatusView from "./OrderStatusView";
import Link from "next/link";
import { AlertTriangle, MessageSquare, ShoppingBag } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        verificationStatus: true,
        orderStatus: true,
      },
    });

    if (!order) {
      return {
        title: "Order Not Found | Kiddiq",
        description: "Verify your order details or contact support.",
      };
    }

    return {
      title: `Order #${order.id.slice(0, 8).toUpperCase()} Status | Kiddiq`,
      description: `Track your order payment verification status, shipping updates, and item breakdown.`,
    };
  } catch {
    return {
      title: "Order Tracking | Kiddiq",
      description: "Check your order manual verification and delivery status.",
    };
  }
}

export default async function OrderStatusPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  let order = null;
  let queryError: string | null = null;

  try {
    order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      queryError = "Order ID Not Found";
    }
  } catch (err) {
    console.error("Error fetching order status:", err);
    queryError = err instanceof Error ? err.message : "System Query Error";
  }

  // Render stylized "Order Not Found / System Error" card if order is missing or DB failed
  if (queryError || !order) {
    const errorReason = queryError || "Order ID Not Found";
    const whatsappMessage = `Hi Kiddiq, I am facing an issue while checking my order status. The system is showing this error: ${errorReason} (ID: ${id}). Please help me resolve this!`;
    const whatsappUrl = `https://wa.me/8801825462039?text=${encodeURIComponent(whatsappMessage)}`;

    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 flex flex-col items-center justify-center flex-1">
        <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl text-center space-y-6">
          {/* Error Indicator Icon */}
          <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center text-brand-yellow-dark shadow-inner">
            <AlertTriangle className="h-8 w-8 text-brand-yellow" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-brand-blue-dark font-sans tracking-tight">
              Order Status Lookup Failed
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              We encountered an issue while loading your order status details. Please verify your order link or contact our support team.
            </p>
          </div>

          {/* Diagnostic Info Box */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 text-left space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wide">
              <span>Searched ID</span>
              <span className="font-mono text-slate-500 lowercase bg-slate-200/50 px-2 py-0.5 rounded-md truncate max-w-[220px]">
                {id}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wide border-t border-slate-200/60 pt-2.5">
              <span>Diagnostics</span>
              <span className="font-semibold text-brand-yellow-dark bg-brand-yellow-light/40 px-2.5 py-0.5 rounded-md">
                {errorReason}
              </span>
            </div>
          </div>

          {/* Support Actions */}
          <div className="space-y-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-6 flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all duration-300 hover:scale-102 cursor-pointer"
            >
              <MessageSquare className="h-5 w-5" />
              Contact Support via WhatsApp
            </a>

            <Link
              href="/shop"
              className="w-full min-h-[48px] px-6 flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5 text-slate-500" />
              Go to Shop Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Serialize JSON fields (e.g. items) so they pass correctly to Client Component
  const serializedOrder = {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: Array.isArray(order.items) ? order.items : [],
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* Breadcrumbs */}
      <nav className="mb-6 md:mb-8 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-blue transition-colors">
          Home
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/shop" className="hover:text-brand-blue transition-colors">
          Shop
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 truncate max-w-[200px]" aria-current="page">
          Order Status
        </span>
      </nav>

      {/* Title Header */}
      <div className="mb-6 md:mb-8">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Tracking
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue-dark sm:text-4xl">
          Order Status
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Track your manual payment verification, packaging progress, and delivery timeline.
        </p>
      </div>

      {/* Main Order Status View Client Component */}
      <OrderStatusView order={serializedOrder} />
    </div>
  );
}
