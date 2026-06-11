"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createDirectSale,
  updateDirectSale,
  deleteDirectSale,
} from "@/app/actions/pos-sales";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  Inbox,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
}

interface DirectSale {
  id: string;
  date: Date | string;
  productId: string;
  quantity: number;
  price: number;
  receivedBy: string;
  comment: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  product: {
    title: string;
  };
}

interface POSDashboardClientProps {
  products: Product[];
  initialSales: DirectSale[];
  cashierEmail: string;
}

interface SaleFormState {
  productId: string;
  quantity: number;
  price: number;
  date: string;
  comment: string;
}

function formatDateToLocalInput(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function POSDashboardClient({
  products,
  initialSales,
  cashierEmail,
}: POSDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<DirectSale | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<SaleFormState>({
    productId: "",
    quantity: 1,
    price: 0,
    date: "",
    comment: "",
  });

  // Notifications State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Find currently selected product details
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === form.productId) || null;
  }, [form.productId, products]);

  // Handle Product Dropdown selection
  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      price: prod ? prod.price : 0,
    }));
  };

  // Open Form modal for creation
  const handleCreateOpen = () => {
    setEditingSale(null);
    setForm({
      productId: products[0]?.id || "",
      quantity: 1,
      price: products[0]?.price || 0,
      date: "",
      comment: "",
    });
    setIsFormOpen(true);
  };

  // Open Form modal for editing
  const handleEditOpen = (sale: DirectSale) => {
    setEditingSale(sale);
    setForm({
      productId: sale.productId,
      quantity: sale.quantity,
      price: sale.price,
      date: formatDateToLocalInput(sale.date),
      comment: sale.comment || "",
    });
    setIsFormOpen(true);
  };

  // Open Delete confirmation dialog
  const handleDeleteOpen = (id: string) => {
    setDeletingSaleId(id);
    setIsDeleteOpen(true);
  };

  // Submit sale creation or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!form.productId) {
      showNotification("error", "Please select a product");
      return;
    }

    if (form.quantity <= 0) {
      showNotification("error", "Quantity must be at least 1");
      return;
    }

    // Client-side stock check for creation and modification
    if (selectedProduct) {
      let maxStock = selectedProduct.stock;
      if (editingSale && editingSale.productId === form.productId) {
        maxStock += editingSale.quantity;
      }
      if (form.quantity > maxStock) {
        showNotification(
          "error",
          `Insufficient stock in inventory. Only ${maxStock} items available.`
        );
        return;
      }
    }

    startTransition(async () => {
      let res;
      if (editingSale) {
        res = await updateDirectSale(editingSale.id, {
          productId: form.productId,
          quantity: Number(form.quantity),
          price: Number(form.price),
          date: form.date || null,
          comment: form.comment || null,
        });
      } else {
        res = await createDirectSale({
          productId: form.productId,
          quantity: Number(form.quantity),
          price: Number(form.price),
          date: form.date || null,
          comment: form.comment || null,
        });
      }

      if (res.success) {
        showNotification(
          "success",
          editingSale
            ? "POS direct sale record updated successfully."
            : "Walk-in POS sale recorded successfully."
        );
        setIsFormOpen(false);
        router.refresh();
      } else {
        showNotification("error", res.error || "Operation failed.");
      }
    });
  };

  // Submit deletion
  const handleDeleteSubmit = async () => {
    if (!deletingSaleId) return;

    startTransition(async () => {
      const res = await deleteDirectSale(deletingSaleId);
      if (res.success) {
        showNotification("success", "Direct sale record removed, stock restored.");
        setIsDeleteOpen(false);
        setDeletingSaleId(null);
        router.refresh();
      } else {
        showNotification("error", res.error || "Failed to delete sale.");
      }
    });
  };

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    return initialSales.filter((sale) => {
      const title = sale.product?.title?.toLowerCase() || "";
      const cashier = sale.receivedBy?.toLowerCase() || "";
      const comment = sale.comment?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return title.includes(search) || cashier.includes(search) || comment.includes(search);
    });
  }, [initialSales, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-md transition-all duration-300 font-sans ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {notification.type === "success" ? "Success" : "Error Occurred"}
            </p>
            <p className="text-xs mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* POS Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, cashier email, comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-sans focus:outline-none transition-colors"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreateOpen}
          className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-100 text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Record Direct Sale</span>
        </button>
      </div>

      {/* Sales Ledger - Desktop View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">
                <th className="px-6 py-4">Sale Date & Time</th>
                <th className="px-6 py-4">Product details</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Received By</th>
                <th className="px-6 py-4">Comments</th>
                <th className="px-6 py-4 text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-sans">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(sale.date).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                        {sale.product?.title || "Deleted Product"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      ৳{sale.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      ৳{(sale.quantity * sale.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {sale.receivedBy}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-500 text-xs max-w-xs truncate" title={sale.comment || ""}>
                        {sale.comment || <span className="text-slate-300 italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditOpen(sale)}
                          className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          title="Edit Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOpen(sale.id)}
                          className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Inbox className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold">No direct sales found</p>
                      <p className="text-xs">Try searching for a different term or record a new transaction.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Ledger - Mobile & Tablet View */}
      <div className="lg:hidden space-y-4">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 font-sans leading-tight">
                    {sale.product?.title || "Deleted Product"}
                  </h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {new Date(sale.date).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">
                    ৳{(sale.quantity * sale.price).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {sale.quantity} × ৳{sale.price}
                  </div>
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Received By</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {sale.receivedBy}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Comments</span>
                  <span className="font-medium text-slate-600 block truncate">
                    {sale.comment || <span className="text-slate-300 italic">None</span>}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleEditOpen(sale)}
                  className="h-11 px-4 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteOpen(sale.id)}
                  className="h-11 px-4 border border-slate-200 hover:border-red-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-red-600 hover:bg-red-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white py-12 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Inbox className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-semibold">No direct sales found</p>
              <p className="text-xs">Try modifying your query or recording a new sale.</p>
            </div>
          </div>
        )}
      </div>

      {/* Record / Edit Sale Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-blue-600" />
                {editingSale ? "Modify POS Sale Entry" : "Record POS Direct Sale"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-11 h-11 rounded-xl hover:bg-black/5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Product Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                    Select Product
                  </label>
                  <select
                    value={form.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    disabled={editingSale !== null}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors bg-white disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Select a Product --
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (Stock: {p.stock} | Price: ৳{p.price})
                      </option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <span>Current Inventory Stock:</span>
                      <span
                        className={`font-semibold ${
                          selectedProduct.stock > 0
                            ? "text-emerald-600"
                            : "text-red-500 font-bold"
                        }`}
                      >
                        {selectedProduct.stock} items available
                      </span>
                      {editingSale && editingSale.productId === selectedProduct.id && (
                        <span className="text-slate-400">
                          (+{editingSale.quantity} reserved in this transaction)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))
                      }
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Unit Price (Custom Override)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.price}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, price: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors"
                    />
                  </div>
                </div>

                {/* Total Calculation Display */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-sans flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Transaction Subtotal:</span>
                  <span className="font-bold text-lg text-slate-900">
                    ৳{(form.quantity * form.price).toFixed(2)}
                  </span>
                </div>

                {/* Date Selector (for backdating) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Sale Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors bg-white cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave blank to automatically capture the current timestamp. Support historical entries.
                  </p>
                </div>

                {/* Cashier / Received By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                    Received By / Cashier (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cashierEmail}
                    className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-sm font-mono font-medium focus:outline-none"
                  />
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                    Comments / Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Enter invoice notes, customer info, or walk-in sale observations..."
                    rows={2}
                    value={form.comment}
                    onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 p-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-11 px-6 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm cursor-pointer shadow-sm shadow-blue-100"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingSale ? "Update Sale" : "Complete Transaction"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">Delete POS Sale Record?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Are you sure you want to delete this direct sale record? The item count will be restored
                  back to the product stock level. This audit action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeletingSaleId(null);
                }}
                className="w-1/2 h-11 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="w-1/2 h-11 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm cursor-pointer shadow-sm shadow-red-100"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
