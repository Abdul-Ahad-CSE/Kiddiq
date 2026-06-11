"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface Order {
  id: string;
  createdAt: Date | string;
  amountPaid: number;
  orderStatus: string;
  items: string; // JSON string
}

interface OrderListCardProps {
  order: Order;
}

export default function OrderListCard({ order }: OrderListCardProps) {
  // Safe date formatting without timezone / locale hydration mismatch
  const formattedDate = (() => {
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return String(order.createdAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return String(order.createdAt);
    }
  })();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending_verification":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "confirmed":
      case "processing":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "shipped":
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const statusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans font-extrabold text-slate-900 text-base">
            Order ID: #{order.id}
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-none font-sans ${getStatusStyle(order.orderStatus)}`}>
            {statusLabel(order.orderStatus)}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 font-sans">
          <span>Placed Date: {formattedDate}</span>
          <span className="font-bold text-slate-800">
            Total Amount: ৳{order.amountPaid}
          </span>
        </div>
      </div>

      <div>
        <Link
          href={`/order-status/${order.id}`}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-none transition-colors duration-200 w-full md:w-auto font-sans"
        >
          <span>View Details</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </div>
  );
}
