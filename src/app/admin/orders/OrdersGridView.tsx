"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Order, OrderStatus, VerificationStatus } from "@/generated/prisma/client";
import {
  verifyOrderPayment,
  rejectOrderPayment,
  updateOrderStatus,
} from "@/app/actions/admin-orders";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Package,
  User,
  CreditCard,
  MapPin,
} from "lucide-react";

interface OrdersGridViewProps {
  initialData: {
    orders: Order[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  search: string;
  verify: string;
  status: string;
}

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export default function OrdersGridView({
  initialData,
  search,
  verify,
  status,
}: OrdersGridViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Local state for search input text
  const [prevSearch, setPrevSearch] = useState(search);
  const [searchVal, setSearchVal] = useState(search);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setShowRejectionForm(false);
    setRejectionNotes("");
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setShowRejectionForm(false);
    setRejectionNotes("");
  };

  const handleVerify = (orderId: string) => {
    startTransition(async () => {
      try {
        const res = await verifyOrderPayment(orderId);
        if (res.success && res.order) {
          setSelectedOrder(res.order as Order);
          router.refresh();
        } else {
          alert(res.error || "Failed to verify payment");
        }
      } catch {
        alert("An error occurred during verification");
      }
    });
  };

  const handleReject = (orderId: string) => {
    if (!rejectionNotes.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }
    startTransition(async () => {
      try {
        const res = await rejectOrderPayment(orderId, rejectionNotes.trim());
        if (res.success && res.order) {
          setSelectedOrder(res.order as Order);
          setShowRejectionForm(false);
          setRejectionNotes("");
          router.refresh();
        } else {
          alert(res.error || "Failed to reject payment");
        }
      } catch {
        alert("An error occurred during rejection");
      }
    });
  };

  const handleStatusChangeAction = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const res = await updateOrderStatus(orderId, newStatus as OrderStatus);
        if (res.success) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, orderStatus: newStatus as OrderStatus } : null
          );
          router.refresh();
        } else {
          alert(res.error || "Failed to update order status");
        }
      } catch {
        alert("An error occurred while updating order status");
      }
    });
  };

  // Adjust state during render phase if prop changes externally
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchVal(search);
  }

  // Debounced search updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== search) {
        const params = new URLSearchParams(window.location.search);
        if (searchVal.trim()) {
          params.set("search", searchVal.trim());
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to first page
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchVal, search, pathname, router]);

  const handleVerifyChange = (newVerify: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newVerify) {
      params.set("verify", newVerify);
    } else {
      params.delete("verify");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(window.location.search);
    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > initialData.totalPages) return;
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    router.push(pathname);
  };

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const hasActiveFilters = !!(search || verify || status);

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateInput: Date | string) => {
    return new Date(dateInput).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge dynamic style mapping (Color Ban: strictly avoiding unauthorized color schemes)
  const getVerificationBadgeStyles = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-emerald-50 text-emerald-700 border border-emerald-500/20";
      case "rejected":
        return "bg-red-50 text-red-700 border border-red-500/20";
      default:
        return "bg-amber-50 text-amber-700 border border-amber-500/20";
    }
  };

  const getOrderStatusStyles = (status: string) => {
    switch (status) {
      case "confirmed":
      case "processing":
        return "bg-blue-50 text-blue-700 border border-blue-500/20";
      case "shipped":
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border border-emerald-500/20";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-500/20";
      default:
        return "bg-amber-50 text-amber-700 border border-amber-500/20";
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
            Order Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, search, verify and update customer purchases from a unified control grid.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 space-y-3 md:space-y-0 md:flex md:items-center md:gap-3">
        {/* Search Input */}
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white placeholder-slate-400 transition-all text-slate-900"
            placeholder="Search Name, Phone, Transaction ID..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              style={{ minWidth: "48px" }}
            >
              <X className="h-5 w-5 mx-auto" />
            </button>
          )}
        </div>

        {/* Select Dropdown: Verification Status */}
        <div className="w-full md:w-56 shrink-0">
          <select
            className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
            value={verify}
            onChange={(e) => handleVerifyChange(e.target.value)}
          >
            <option value="">All Verification Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Select Dropdown: Order Status */}
        <div className="w-full md:w-64 shrink-0">
          <select
            className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Order Statuses</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="w-full md:w-auto h-12 px-5 flex items-center justify-center gap-2 border-2 border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white font-semibold text-xs tracking-wider uppercase transition-all shrink-0"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Grid count summary */}
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Showing {initialData.orders.length} of {initialData.totalCount} orders found
      </div>

      {/* No Results Fallback */}
      {initialData.orders.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 uppercase">No orders found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search criteria or clear the filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Tabular Grid View */}
          <div className="hidden md:block bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold text-slate-900 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Order ID</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Customer</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Date</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Amount</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Verification</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-200">Order Status</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {initialData.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 border-r border-slate-200">
                      #{order.id.slice(0, 8)}
                    </td>
                    {/* Customer */}
                    <td className="px-6 py-4 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="font-mono text-xs text-slate-500 mt-0.5">{order.phone}</div>
                    </td>
                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-slate-500 border-r border-slate-200">
                      {formatDate(order.createdAt)}
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 border-r border-slate-200">
                      {formatCurrency(order.amountPaid + order.amountDueOnDelivery)}
                    </td>
                    {/* Verification Status */}
                    <td className="px-6 py-4 border-r border-slate-200">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-none uppercase tracking-wider ${getVerificationBadgeStyles(
                          order.verificationStatus
                        )}`}
                      >
                        {order.verificationStatus}
                      </span>
                    </td>
                    {/* Order Status */}
                    <td className="px-6 py-4 border-r border-slate-200">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-none uppercase tracking-wider ${getOrderStatusStyles(
                          order.orderStatus
                        )}`}
                      >
                        {formatStatusText(order.orderStatus)}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openModal(order)}
                        className="inline-flex h-12 px-4 items-center justify-center border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack Layout */}
          <div className="block md:hidden space-y-4">
            {initialData.orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 p-4 space-y-4"
              >
                {/* Header (ID and Date) */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {formatCurrency(order.amountPaid + order.amountDueOnDelivery)}
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Customer
                  </span>
                  <span className="text-sm font-bold text-slate-950 block">
                    {order.customerName}
                  </span>
                  <span className="font-mono text-xs text-slate-500 block">
                    {order.phone}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                      Verification
                    </span>
                    <span
                      className={`w-full inline-flex justify-center px-2 py-1 text-[10px] font-bold rounded-none uppercase tracking-wider ${getVerificationBadgeStyles(
                        order.verificationStatus
                      )}`}
                    >
                      {order.verificationStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                      Order Status
                    </span>
                    <span
                      className={`w-full inline-flex justify-center px-2 py-1 text-[10px] font-bold rounded-none uppercase tracking-wider ${getOrderStatusStyles(
                        order.orderStatus
                      )}`}
                    >
                      {formatStatusText(order.orderStatus)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => openModal(order)}
                  className="w-full h-12 flex items-center justify-center border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Page {initialData.currentPage} of {initialData.totalPages} ({initialData.totalCount} items total)
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(initialData.currentPage - 1)}
                disabled={initialData.currentPage === 1}
                className="flex-1 sm:flex-none h-12 px-6 inline-flex items-center justify-center gap-1 border-2 border-slate-950 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-slate-950 hover:enabled:text-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => handlePageChange(initialData.currentPage + 1)}
                disabled={initialData.currentPage === initialData.totalPages}
                className="flex-1 sm:flex-none h-12 px-6 inline-flex items-center justify-center gap-1 border-2 border-slate-950 text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-slate-950 hover:enabled:text-white transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quick View Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          {/* Modal Container (Strict raw solid borders, no background blur) */}
          <div className="bg-white border-2 border-slate-950 w-full max-w-4xl max-h-[90vh] flex flex-col relative transition-all">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-950 uppercase tracking-tight">
                  Order Details
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-slate-600">
                    ID: #{selectedOrder.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.id)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors focus:outline-none"
                    title="Copy Full Order ID"
                  >
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="h-12 w-12 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-400 flex items-center justify-center transition-colors focus:outline-none"
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Top status bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verification
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 ${getVerificationBadgeStyles(
                      selectedOrder.verificationStatus
                    )}`}
                  >
                    {selectedOrder.verificationStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Order Status
                  </span>
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 ${getOrderStatusStyles(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {formatStatusText(selectedOrder.orderStatus)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sales Channel
                  </span>
                  <span className="inline-flex px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider mt-1 bg-slate-200 text-slate-800 border border-slate-300">
                    Online Store
                  </span>
                </div>
              </div>

              {/* Customer and Shipping Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 pt-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-500" />
                    Customer Information
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs uppercase block">Full Name</span>
                      <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase block">Phone Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedOrder.phone}</span>
                    </div>
                    {selectedOrder.email && (
                      <div>
                        <span className="text-slate-400 text-xs uppercase block">Email Address</span>
                        <span className="text-slate-900">{selectedOrder.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    Shipping Information
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs uppercase block">District</span>
                      <span className="font-bold text-slate-900">{selectedOrder.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase block">Area</span>
                      <span className="font-bold text-slate-900">{selectedOrder.area}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase block">Full Address</span>
                      <span className="text-slate-900 leading-relaxed">{selectedOrder.fullAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Proofs Box */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  Payment Proofs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-slate-50 border border-slate-200 p-4 text-xs font-medium text-slate-600">
                  <div className="space-y-1 border-r border-slate-200 pr-2">
                    <span className="text-slate-400 uppercase text-[9px] block">Payment Option</span>
                    <span className="font-bold text-slate-900">
                      {selectedOrder.paymentOption === "COD" ? "Advance + COD" : "Full Advance"}
                    </span>
                  </div>
                  <div className="space-y-1 border-r border-slate-200 pr-2">
                    <span className="text-slate-400 uppercase text-[9px] block">Payment Method</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="space-y-1 border-r border-slate-200 pr-2">
                    <span className="text-slate-400 uppercase text-[9px] block">Sender Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedOrder.senderNumber}</span>
                  </div>
                  <div className="space-y-1 border-r border-slate-200 pr-2">
                    <span className="text-slate-400 uppercase text-[9px] block">Transaction ID</span>
                    <span className="font-mono font-bold text-slate-900">{selectedOrder.transactionId}</span>
                  </div>
                  <div className="space-y-1 border-r border-slate-200 pr-2">
                    <span className="text-slate-400 uppercase text-[9px] block">Amount Paid</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedOrder.amountPaid)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase text-[9px] block">Due on Delivery</span>
                    <span className="font-mono font-bold text-slate-900 text-rose-600">{formatCurrency(selectedOrder.amountDueOnDelivery)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Panel Operations */}
              <div className="border border-slate-200 p-6 space-y-4 bg-slate-50 relative">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  Admin Panel Operations
                </h3>

                {isPending && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                    <div className="h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Case 4: Order is CANCELLED */}
                {selectedOrder.orderStatus === "cancelled" ? (
                  <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                    <p className="font-bold uppercase tracking-wider text-xs mb-1">Order Cancelled</p>
                    <p>This order has been cancelled and cannot be modified.</p>
                  </div>
                ) : /* Case 1: Verification is PENDING */
                selectedOrder.verificationStatus === "pending" ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      <p className="font-bold uppercase tracking-wider text-xs mb-1">Verification Required</p>
                      <p>Payment Verification Required: Please review manual transfer credentials and transaction ID above.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleVerify(selectedOrder.id)}
                        disabled={isPending}
                        className="flex-1 h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ minHeight: "48px" }}
                      >
                        <Check className="h-4 w-4" />
                        Verify & Confirm Order
                      </button>
                      <button
                        onClick={() => setShowRejectionForm(prev => !prev)}
                        disabled={isPending}
                        className="flex-1 h-12 px-6 border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ minHeight: "48px" }}
                      >
                        <X className="h-4 w-4" />
                        Reject Payment
                      </button>
                    </div>

                    {showRejectionForm && (
                      <div className="border border-slate-200 p-4 bg-white space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Rejection Reason
                        </label>
                        <textarea
                          placeholder="Enter reason for rejection... e.g. Invalid Transaction ID, incorrect amount paid"
                          value={rejectionNotes}
                          onChange={(e) => setRejectionNotes(e.target.value)}
                          className="w-full min-h-[80px] p-3 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-900"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleReject(selectedOrder.id)}
                            disabled={isPending}
                            className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
                            style={{ minHeight: "48px" }}
                          >
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectionForm(false);
                              setRejectionNotes("");
                            }}
                            disabled={isPending}
                            className="h-12 px-6 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
                            style={{ minHeight: "48px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : /* Case 2: Verification is VERIFIED and order is not CANCELLED/DELIVERED */
                selectedOrder.verificationStatus === "verified" ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                      <p className="font-bold uppercase tracking-wider text-xs mb-1">Payment Verified</p>
                      <p>This order payment has been verified. Current order status: <span className="font-bold uppercase">{selectedOrder.orderStatus}</span></p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4">
                      <div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Update Order Progress
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Change fulfillment or transit state.
                        </p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <select
                          value={selectedOrder.orderStatus}
                          disabled={
                            isPending ||
                            selectedOrder.orderStatus === "delivered"
                          }
                          onChange={(e) => handleStatusChangeAction(selectedOrder.id, e.target.value)}
                          className="w-full h-12 px-3 bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : /* Case 3: Verification is REJECTED */
                selectedOrder.verificationStatus === "rejected" ? (
                  <div className="space-y-4">
                    <div className="bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 space-y-1">
                      <p className="font-bold uppercase tracking-wider text-xs">Payment Rejected</p>
                      <p>This order payment was rejected.</p>
                      {selectedOrder.adminNotes && (
                        <p className="mt-1">
                          <span className="font-semibold">Rejection Reason:</span> {selectedOrder.adminNotes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setSelectedOrder((prev) =>
                          prev ? { ...prev, verificationStatus: "pending" as VerificationStatus } : null
                        )
                      }
                      disabled={isPending}
                      className="h-12 px-6 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
                      style={{ minHeight: "48px" }}
                    >
                      Re-Verify Payment
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Order Items Breakdown */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Package className="h-4 w-4 text-slate-500" />
                  Order Items Breakdown
                </h3>
                <div className="border border-slate-200 overflow-x-auto">
                  <table className="w-full min-w-[500px] border-collapse text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-900 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-bold border-r border-slate-200">Item</th>
                        <th className="px-4 py-3 font-bold border-r border-slate-200 text-right">Price</th>
                        <th className="px-4 py-3 font-bold border-r border-slate-200 text-center">Qty</th>
                        <th className="px-4 py-3 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {((selectedOrder.items as unknown) as OrderItem[]).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 border-r border-slate-200 flex items-center gap-2">
                            <span className="h-8 w-8 bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-500">
                              <Package className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{item.title}</div>
                              <div className="text-[10px] font-mono text-slate-400">{item.id}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-slate-200 text-right font-mono text-slate-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-200 text-center font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 text-[11px] uppercase tracking-wider">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right border-r border-slate-200">Subtotal</td>
                        <td className="px-4 py-2 text-right font-mono">{formatCurrency(selectedOrder.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right border-r border-slate-200">Delivery Charge</td>
                        <td className="px-4 py-2 text-right font-mono">{formatCurrency(selectedOrder.deliveryCharge)}</td>
                      </tr>
                      <tr className="border-t border-slate-950 font-black text-slate-950 bg-slate-100">
                        <td colSpan={3} className="px-4 py-3 text-right border-r border-slate-200 text-xs">Total Order Value</td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {formatCurrency(selectedOrder.subtotal + selectedOrder.deliveryCharge)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={closeModal}
                className="h-12 px-6 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all"
                style={{ minWidth: "120px", minHeight: "48px" }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
