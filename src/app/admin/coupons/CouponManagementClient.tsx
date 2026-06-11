"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  AlertTriangle,
  Check,
  RefreshCw,
  Ticket,
} from "lucide-react";
import {
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from "@/app/actions/admin-coupons";

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponManagementClientProps {
  initialCoupons: Coupon[];
}

export default function CouponManagementClient({
  initialCoupons,
}: CouponManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog / Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form inputs state
  const [formState, setFormState] = useState({
    code: "",
    discountPercent: "",
    minOrderAmount: "",
  });

  // Notification / Inline Error states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    discountPercent?: string;
    minOrderAmount?: string;
  }>({});

  // Clean success/error notifications
  const clearNotifications = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setValidationErrors({});
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    clearNotifications();
    setFormState({
      code: "",
      discountPercent: "",
      minOrderAmount: "0",
    });
    setModalMode("create");
    setSelectedCoupon(null);
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (coupon: Coupon) => {
    clearNotifications();
    setFormState({
      code: coupon.code,
      discountPercent: coupon.discountPercent.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
    });
    setModalMode("edit");
    setSelectedCoupon(coupon);
    setIsFormOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (coupon: Coupon) => {
    clearNotifications();
    setSelectedCoupon(coupon);
    setIsDeleteOpen(true);
  };

  // Client-side form input validation
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    if (modalMode === "create" && !formState.code.trim()) {
      errors.code = "Coupon code is required.";
      isValid = false;
    }

    const discountNum = parseFloat(formState.discountPercent);
    if (isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      errors.discountPercent = "Discount must be between 1% and 100%.";
      isValid = false;
    }

    const minAmountNum = parseFloat(formState.minOrderAmount);
    if (isNaN(minAmountNum) || minAmountNum < 0) {
      errors.minOrderAmount = "Minimum order amount must be 0 or greater.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();

    if (!validateForm()) return;

    startTransition(async () => {
      let res;
      if (modalMode === "create") {
        res = await createCoupon({
          code: formState.code.trim().toUpperCase(),
          discountPercent: parseFloat(formState.discountPercent),
          minOrderAmount: parseFloat(formState.minOrderAmount),
        });
      } else {
        if (!selectedCoupon) return;
        res = await updateCoupon(selectedCoupon.id, {
          discountPercent: parseFloat(formState.discountPercent),
          minOrderAmount: parseFloat(formState.minOrderAmount),
        });
      }

      if (res.success) {
        setSuccessMsg(
          `Coupon "${
            modalMode === "create" ? formState.code.trim().toUpperCase() : selectedCoupon?.code
          }" successfully ${modalMode === "create" ? "created" : "updated"}.`
        );
        setIsFormOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "An error occurred while saving the coupon.");
      }
    });
  };

  // Status toggle handler (touch target 44px height)
  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    clearNotifications();
    const newStatus = !currentStatus;

    startTransition(async () => {
      const res = await toggleCouponStatus(id, newStatus);
      if (res.success) {
        setSuccessMsg(`Status updated successfully.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update status.");
      }
    });
  };

  // Delete confirm handler
  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;
    clearNotifications();

    startTransition(async () => {
      const res = await deleteCoupon(selectedCoupon.id);
      if (res.success) {
        setSuccessMsg(`Coupon "${selectedCoupon.code}" was successfully deleted.`);
        setIsDeleteOpen(false);
        setSelectedCoupon(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to delete coupon.");
      }
    });
  };

  // Client-side filtering
  const filteredCoupons = initialCoupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative font-sans text-slate-800">
      {/* Action Bar (Aligned to Geometric Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-none border border-slate-200 shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center text-slate-800 shrink-0 border border-slate-200">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Coupon Directory
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {initialCoupons.length} coupon codes registered
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="h-12 min-w-[150px] px-6 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-none text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-none text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="FILTER BY COUPON CODE (E.G. KIDDIQ15)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 tracking-wider uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all shadow-xs"
        />
      </div>

      {/* Empty State */}
      {filteredCoupons.length === 0 && (
        <div className="bg-white rounded-none border border-slate-200 shadow-xs p-12 text-center">
          <div className="w-16 h-16 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider">
            No Coupons Found
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">
            No match for &quot;{searchQuery}&quot;. Clear or modify your query.
          </p>
        </div>
      )}

      {/* Desktop View (Table layout) */}
      {filteredCoupons.length > 0 && (
        <div className="hidden md:block bg-white rounded-none border border-slate-200 shadow-xs overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest font-mono">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Min. Subtotal</th>
                <th className="px-6 py-4">Status Toggle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 text-xs font-mono">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-slate-950 text-sm tracking-wide block uppercase">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                    {coupon.discountPercent}%
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    ৳{coupon.minOrderAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {/* Status check / button with large touch area: h-11 = 44px */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                      disabled={isPending}
                      className="h-11 px-3 border border-slate-200 rounded-none flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors min-w-[110px] cursor-pointer disabled:opacity-50"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          coupon.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      ></span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Touch Target 44x44px for actions */}
                      <button
                        onClick={() => handleOpenEdit(coupon)}
                        className="h-11 w-11 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-none flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
                        title="Edit Coupon"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(coupon)}
                        className="h-11 w-11 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-650 border border-slate-200 rounded-none flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile View (Card stack layout) */}
      {filteredCoupons.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white p-4 rounded-none border border-slate-200 shadow-xs flex flex-col gap-3.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-extrabold text-slate-950 text-base tracking-wider block uppercase">
                    {coupon.code}
                  </span>
                  <div className="flex gap-2.5 mt-1 font-mono text-[11px] text-slate-500">
                    <span>Discount: <strong className="text-slate-850 font-bold">{coupon.discountPercent}%</strong></span>
                    <span>•</span>
                    <span>Min: <strong className="text-slate-850 font-bold">৳{coupon.minOrderAmount}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                  disabled={isPending}
                  className="h-11 px-3.5 border border-slate-200 rounded-none flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      coupon.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  ></span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
                    {coupon.isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleOpenEdit(coupon)}
                  className="h-12 flex-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-none flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider cursor-pointer focus:outline-hidden"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenDelete(coupon)}
                  className="h-12 flex-1 bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-none flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider cursor-pointer focus:outline-hidden"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-250">
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-widest font-mono">
                {modalMode === "create" ? "Create Promo Coupon" : "Edit Coupon Rules"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="h-11 w-11 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-none flex items-center justify-center transition-colors cursor-pointer focus:outline-hidden"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-5 flex-1 flex flex-col gap-4">
              {/* General API Error message inside modal */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-250 text-rose-800 text-[11px] rounded-none font-semibold flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="coupon-code"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="E.G. KIDDIQ15"
                  value={formState.code}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={modalMode === "edit"}
                  className="w-full h-12 px-4 border border-slate-250 bg-white disabled:bg-slate-100 disabled:text-slate-500 rounded-none text-sm text-slate-800 font-mono tracking-wider focus:outline-hidden focus:ring-1 focus:ring-slate-800 focus:border-slate-800 uppercase"
                  required
                />
                {validationErrors.code && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.code}
                  </p>
                )}
              </div>

              {/* Discount Percent Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="coupon-discount"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Discount Percent (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="coupon-discount"
                  type="number"
                  placeholder="e.g. 15"
                  value={formState.discountPercent}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      discountPercent: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
                  required
                  min="1"
                  max="100"
                />
                {validationErrors.discountPercent && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.discountPercent}
                  </p>
                )}
              </div>

              {/* Minimum Order Amount Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="coupon-min-order"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Minimum Order Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="coupon-min-order"
                  type="number"
                  placeholder="e.g. 1500"
                  value={formState.minOrderAmount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      minOrderAmount: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
                  required
                  min="0"
                />
                {validationErrors.minOrderAmount && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.minOrderAmount}
                  </p>
                )}
              </div>

              {/* Modal Buttons (h-12 = 48px) */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-hidden"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-12 px-6 bg-slate-950 hover:bg-slate-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Coupon</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {isDeleteOpen && selectedCoupon && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-none bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-widest font-mono">
                  Delete Coupon Rule?
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-mono leading-relaxed">
                  Are you sure you want to delete coupon{" "}
                  <strong className="text-slate-900 font-extrabold">
                    {selectedCoupon.code}
                  </strong>
                  ? This will immediately prevent customers from using it. This action is
                  irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer focus:outline-hidden"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Coupon</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
