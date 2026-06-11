"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  X,
  Search,
  AlertTriangle,
  Check,
  RefreshCw,
  Percent,
  ExternalLink,
  Coins,
  FileText,
} from "lucide-react";
import {
  createInvestment,
  deleteInvestment,
  createExpense,
  deleteExpense,
} from "@/app/actions/finance";
import { uploadMediaAction } from "@/lib/upload";

interface Investment {
  id: string;
  person: string;
  amount: number;
  comment: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Expense {
  id: string;
  paidBy: string;
  amount: number;
  comment: string;
  invoiceUrl: string | null;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface FinancialSummary {
  totalInvest: number;
  totalExpense: number;
  totalSell: number;
  totalCogs: number;
  inHand: number;
  netProfit: number;
}

interface FinanceDashboardClientProps {
  initialSummary: FinancialSummary;
  initialInvestments: Investment[];
  initialExpenses: Expense[];
  adminEmail: string;
}

export default function FinanceDashboardClient({
  initialSummary,
  initialInvestments,
  initialExpenses,
  adminEmail,
}: FinanceDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Ledger view state: "investments" | "expenses"
  const [activeTab, setActiveTab] = useState<"investments" | "expenses">("investments");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "investment" | "expense";
    id: string;
    label: string;
  } | null>(null);

  // Form states
  const getLocalDateTimeString = () => {
    const date = new Date();
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const [investmentForm, setInvestmentForm] = useState({
    person: adminEmail,
    amount: "",
    date: "",
    comment: "",
  });

  const [expenseForm, setExpenseForm] = useState<{
    paidBy: string;
    amount: string;
    date: string;
    comment: string;
    file: File | null;
  }>({
    paidBy: adminEmail,
    amount: "",
    date: "",
    comment: "",
    file: null,
  });


  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    amount?: string;
    comment?: string;
    file?: string;
  }>({});

  const clearNotifications = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setValidationErrors({});
  };

  // Modal Open Handlers
  const handleOpenAddInvestment = () => {
    clearNotifications();
    setInvestmentForm({
      person: adminEmail,
      amount: "",
      date: getLocalDateTimeString(),
      comment: "",
    });
    setIsInvestmentOpen(true);
  };

  const handleOpenAddExpense = () => {
    clearNotifications();
    setExpenseForm({
      paidBy: adminEmail,
      amount: "",
      date: getLocalDateTimeString(),
      comment: "",
      file: null,
    });
    setIsExpenseOpen(true);
  };

  // Client Validation
  const validateInvestment = () => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    const amt = parseFloat(investmentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = "Amount must be a positive number.";
      isValid = false;
    }

    if (!investmentForm.comment.trim()) {
      errors.comment = "Comment/description is required.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const validateExpense = () => {
    const errors: typeof validationErrors = {};
    let isValid = true;

    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = "Amount must be a positive number.";
      isValid = false;
    }

    if (!expenseForm.comment.trim()) {
      errors.comment = "Comment/description is required.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Submit Handlers
  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();

    if (!validateInvestment()) return;

    startTransition(async () => {
      const res = await createInvestment({
        person: investmentForm.person.trim(),
        amount: parseFloat(investmentForm.amount),
        comment: investmentForm.comment.trim(),
        date: investmentForm.date ? new Date(investmentForm.date) : undefined,
      });

      if (res.success) {
        setSuccessMsg(`Capital investment of ৳${parseFloat(investmentForm.amount).toLocaleString()} successfully logged.`);
        setIsInvestmentOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to log investment.");
      }
    });
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();

    if (!validateExpense()) return;

    startTransition(async () => {
      let uploadedUrl: string | null = null;

      if (expenseForm.file) {
        try {
          const formData = new FormData();
          formData.append("file", expenseForm.file);
          uploadedUrl = await uploadMediaAction(formData);
        } catch (err) {
          console.error("Receipt upload error:", err);
          setErrorMsg("Receipt upload failed. Transaction was not recorded.");
          return;
        }
      }

      const res = await createExpense({
        paidBy: expenseForm.paidBy.trim(),
        amount: parseFloat(expenseForm.amount),
        comment: expenseForm.comment.trim(),
        invoiceUrl: uploadedUrl,
        date: expenseForm.date ? new Date(expenseForm.date) : undefined,
      });

      if (res.success) {
        setSuccessMsg(`Operating expense of ৳${parseFloat(expenseForm.amount).toLocaleString()} successfully logged.`);
        setIsExpenseOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to log expense.");
      }
    });
  };

  // Delete Action Handlers
  const handleDeleteTrigger = (type: "investment" | "expense", item: { id: string; amount: number }) => {
    clearNotifications();
    setDeleteConfirm({
      type,
      id: item.id,
      label: item.amount.toLocaleString(),
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    clearNotifications();

    startTransition(async () => {
      const { type, id, label } = deleteConfirm;
      let res;
      if (type === "investment") {
        res = await deleteInvestment(id);
      } else {
        res = await deleteExpense(id);
      }

      if (res.success) {
        setSuccessMsg(`${type === "investment" ? "Investment" : "Expense"} of ৳${label} successfully deleted.`);
        setDeleteConfirm(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || `Failed to delete ${type}.`);
        setDeleteConfirm(null);
      }
    });
  };

  // Form file change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          file: "File size exceeds 5MB limit.",
        }));
        return;
      }
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setValidationErrors((prev) => ({
          ...prev,
          file: "Unsupported format. Only JPG, PNG, or PDF are accepted.",
        }));
        return;
      }
      setValidationErrors((prev) => ({ ...prev, file: undefined }));
      setExpenseForm((prev) => ({ ...prev, file }));
    }
  };

  // Helpers
  const formatDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const { totalInvest, totalExpense, totalSell, inHand, netProfit } = initialSummary;

  // Filter lists based on query
  const filteredInvestments = initialInvestments.filter(
    (inv) =>
      inv.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = initialExpenses.filter(
    (exp) =>
      exp.paidBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative font-sans text-slate-800">
      
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        
        {/* Total Invest */}
        <div className="bg-white p-5 rounded-none border border-slate-200 border-l-4 border-l-slate-900 shadow-xs flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            Total Invest
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-mono">
              ৳{totalInvest.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Capital injected
          </span>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-none border border-slate-200 border-l-4 border-l-amber-500 shadow-xs flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            Total Expense
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-mono">
              ৳{totalExpense.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Operating outflows
          </span>
        </div>

        {/* Total Sell */}
        <div className="bg-white p-5 rounded-none border border-slate-200 border-l-4 border-l-blue-600 shadow-xs flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            Total Sell
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-mono">
              ৳{totalSell.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            POS & order revenues
          </span>
        </div>

        {/* In Hand */}
        <div className="bg-white p-5 rounded-none border border-slate-200 border-l-4 border-l-slate-400 shadow-xs flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">
            In Hand
          </span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-950 tracking-tight font-mono">
              ৳{inHand.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1 font-semibold">
            (Invest + Sell) - Expense
          </span>
        </div>

        {/* Highly Highlighted Net Profit Card */}
        <div className={`p-5 rounded-none border border-slate-200 border-l-4 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden transition-all duration-350 ${
          netProfit >= 0 
            ? "border-l-emerald-500 bg-emerald-50/20 text-emerald-900" 
            : "border-l-red-500 bg-red-50/20 text-red-900"
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-500">
              Net Profit
            </span>
            {netProfit >= 0 ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase font-mono tracking-wider">
                Surplus
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-extrabold uppercase font-mono tracking-wider">
                Deficit
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-extrabold tracking-tight font-mono ${
              netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            }`}>
              ৳{netProfit.toLocaleString()}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wide">
            Sell - (COGS + Expense)
          </div>
        </div>

      </div>

      {/* Directory Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-none border border-slate-200 shadow-xs mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center text-slate-800 shrink-0 border border-slate-200">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Accounting Directory
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {initialInvestments.length} investments & {initialExpenses.length} operating expenses logged
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/coupons"
            className="h-12 min-w-[140px] px-5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-hidden"
          >
            <Percent className="w-4 h-4" />
            <span>Manage Coupons</span>
          </Link>
          <button
            onClick={handleOpenAddInvestment}
            className="h-12 min-w-[140px] px-5 bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-hidden"
          >
            <Plus className="w-4 h-4" />
            <span>Add Investment</span>
          </button>
          <button
            onClick={handleOpenAddExpense}
            className="h-12 min-w-[140px] px-5 bg-slate-800 hover:bg-slate-755 text-white border border-transparent hover:border-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-hidden"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Ledger Tab Navigation (Touch targets height >= 44px) */}
      <div className="flex border-b border-slate-200 mb-6 bg-slate-50/50">
        <button
          onClick={() => {
            setActiveTab("investments");
            clearNotifications();
          }}
          className={`h-12 px-6 text-xs uppercase font-extrabold tracking-wider font-mono border-t-2 border-r border-l border-b border-transparent transition-all cursor-pointer ${
            activeTab === "investments"
              ? "bg-white border-t-slate-950 border-r-slate-200 border-l-slate-200 border-b-white text-slate-950"
              : "text-slate-500 hover:text-slate-900 border-b-slate-200"
          }`}
        >
          Capital Investments ({filteredInvestments.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("expenses");
            clearNotifications();
          }}
          className={`h-12 px-6 text-xs uppercase font-extrabold tracking-wider font-mono border-t-2 border-r border-l border-b border-transparent transition-all cursor-pointer ${
            activeTab === "expenses"
              ? "bg-white border-t-slate-950 border-r-slate-200 border-l-slate-200 border-b-white text-slate-950"
              : "text-slate-500 hover:text-slate-900 border-b-slate-200"
          }`}
        >
          Operating Expenses ({filteredExpenses.length})
        </button>
        <div className="flex-1 border-b border-slate-200"></div>
      </div>

      {/* Search Input (Filters whichever directory active) */}
      <div className="mb-6 relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={`FILTER ${activeTab.toUpperCase()} LEDGER (BY PERSON, COMMENT, PAID BY)...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-none text-xs text-slate-800 placeholder-slate-400 tracking-wider uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-950 transition-all shadow-xs"
        />
      </div>

      {/* Active Directory Views */}
      {activeTab === "investments" ? (
        <>
          {/* Investments: Empty State */}
          {filteredInvestments.length === 0 && (
            <div className="bg-white rounded-none border border-slate-200 shadow-xs p-12 text-center">
              <div className="w-16 h-16 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider">
                No Investments Found
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-mono">
                {searchQuery ? `No match found for "${searchQuery}".` : "No investment records logged yet."}
              </p>
            </div>
          )}

          {/* Investments: Desktop View (Table layout) */}
          {filteredInvestments.length > 0 && (
            <div className="hidden md:block bg-white rounded-none border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest font-mono">
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Injected By</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Comment / Narrative</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-xs font-mono">
                  {filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 block">
                          {inv.person}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-950 text-sm whitespace-nowrap">
                        ৳{inv.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={inv.comment}>
                        {inv.comment}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteTrigger("investment", inv)}
                            className="h-11 w-11 bg-slate-50 hover:bg-rose-50 text-slate-650 hover:text-rose-700 border border-slate-200 rounded-none flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Record"
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

          {/* Investments: Mobile View (Card stack layout) */}
          {filteredInvestments.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredInvestments.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white p-4 rounded-none border border-slate-200 shadow-xs flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {formatDate(inv.date)}
                      </span>
                      <span className="font-extrabold text-slate-950 text-sm tracking-wide block uppercase mt-0.5">
                        {inv.person}
                      </span>
                    </div>
                    <span className="font-bold text-slate-950 text-sm font-mono">
                      ৳{inv.amount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 border border-slate-150">
                    {inv.comment}
                  </p>

                  <div className="flex items-center justify-end border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => handleDeleteTrigger("investment", inv)}
                      className="h-11 w-full bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-none flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Record</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Expenses: Empty State */}
          {filteredExpenses.length === 0 && (
            <div className="bg-white rounded-none border border-slate-200 shadow-xs p-12 text-center">
              <div className="w-16 h-16 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wider">
                No Expenses Found
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-mono">
                {searchQuery ? `No match found for "${searchQuery}".` : "No expense records logged yet."}
              </p>
            </div>
          )}

          {/* Expenses: Desktop View (Table layout) */}
          {filteredExpenses.length > 0 && (
            <div className="hidden md:block bg-white rounded-none border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest font-mono">
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Paid By</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Invoice Receipt</th>
                    <th className="px-6 py-4">Comment / Narrative</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-xs font-mono">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 block">
                          {exp.paidBy}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-950 text-sm whitespace-nowrap">
                        ৳{exp.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exp.invoiceUrl ? (
                          <a
                            href={exp.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 px-3.5 border border-slate-250 hover:bg-slate-50 text-slate-700 hover:text-slate-950 rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[10px] font-extrabold uppercase font-mono tracking-wider min-w-[110px]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None Provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={exp.comment}>
                        {exp.comment}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteTrigger("expense", exp)}
                            className="h-11 w-11 bg-slate-50 hover:bg-rose-50 text-slate-655 hover:text-rose-700 border border-slate-200 rounded-none flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete Record"
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

          {/* Expenses: Mobile View (Card stack layout) */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-4 rounded-none border border-slate-200 shadow-xs flex flex-col gap-3.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {formatDate(exp.date)}
                      </span>
                      <span className="font-extrabold text-slate-950 text-sm tracking-wide block uppercase mt-0.5">
                        {exp.paidBy}
                      </span>
                    </div>
                    <span className="font-bold text-slate-950 text-sm font-mono">
                      ৳{exp.amount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 border border-slate-150">
                    {exp.comment}
                  </p>

                  <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3">
                    {exp.invoiceUrl ? (
                      <a
                        href={exp.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 w-full bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-none flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Invoice File</span>
                      </a>
                    ) : (
                      <div className="h-12 w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-none flex items-center justify-center text-xs font-bold uppercase tracking-wider font-mono">
                        No receipt attached
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteTrigger("expense", exp)}
                      className="h-12 w-full bg-slate-50 hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-none flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Record</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE INVESTMENT MODAL OVERLAY */}
      {isInvestmentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-widest font-mono">
                Log Capital Investment
              </h3>
              <button
                onClick={() => setIsInvestmentOpen(false)}
                className="h-11 w-11 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-none flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleInvestmentSubmit} className="p-5 flex-1 flex flex-col gap-4">
              
              {/* Creator Field (Read-only active session user email) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Cashier / Creator
                </label>
                <input
                  type="text"
                  value={investmentForm.person}
                  readOnly
                  className="w-full h-12 px-4 border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed rounded-none text-sm font-mono focus:outline-hidden"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="invest-amount"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="invest-amount"
                  type="number"
                  placeholder="e.g. 50000"
                  value={investmentForm.amount}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  required
                  min="0.01"
                  step="any"
                />
                {validationErrors.amount && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.amount}
                  </p>
                )}
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="invest-date"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Transaction Timestamp (Optional)
                </label>
                <input
                  id="invest-date"
                  type="datetime-local"
                  value={investmentForm.date}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                />
              </div>

              {/* Comment Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="invest-comment"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Narrative / Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="invest-comment"
                  placeholder="e.g. Seed funding injected for inventory procurement"
                  value={investmentForm.comment}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-3 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  required
                />
                {validationErrors.comment && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.comment}
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsInvestmentOpen(false)}
                  className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
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
                    <span>Log Investment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE MODAL OVERLAY */}
      {isExpenseOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-widest font-mono">
                Log Operating Expense
              </h3>
              <button
                onClick={() => setIsExpenseOpen(false)}
                className="h-11 w-11 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-none flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleExpenseSubmit} className="p-5 flex-1 flex flex-col gap-4">
              
              {/* Creator Field (Read-only active session user email) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Cashier / Paid By
                </label>
                <input
                  type="text"
                  value={expenseForm.paidBy}
                  readOnly
                  className="w-full h-12 px-4 border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed rounded-none text-sm font-mono focus:outline-hidden"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-amount"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  placeholder="e.g. 1500"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  required
                  min="0.01"
                  step="any"
                />
                {validationErrors.amount && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.amount}
                  </p>
                )}
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-date"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Transaction Date (Optional)
                </label>
                <input
                  id="expense-date"
                  type="datetime-local"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full h-12 px-4 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                />
              </div>

              {/* Invoice receipt upload */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-file"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Upload Invoice / Receipt File (Max 5MB)
                </label>
                <div className="relative">
                  <input
                    id="expense-file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 border border-slate-250 bg-white rounded-none h-12 flex items-center file:mr-4 file:py-2 file:px-4 file:h-full file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
                {expenseForm.file && (
                  <p className="text-[10px] font-semibold text-emerald-700 font-mono">
                    File selected: {expenseForm.file.name} ({(expenseForm.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {validationErrors.file && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.file}
                  </p>
                )}
              </div>

              {/* Comment Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-comment"
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono"
                >
                  Narrative / Comment <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="expense-comment"
                  placeholder="e.g. Paid office internet bill for current month"
                  value={expenseForm.comment}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-3 border border-slate-250 bg-white rounded-none text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  required
                />
                {validationErrors.comment && (
                  <p className="text-[11px] font-semibold text-rose-600 font-mono">
                    {validationErrors.comment}
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseOpen(false)}
                  className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
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
                    <span>Log Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL OVERLAY */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-none bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-950 uppercase tracking-widest font-mono">
                  Confirm Record Deletion?
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-mono leading-relaxed">
                  Are you sure you want to delete this {deleteConfirm.type} transaction of{" "}
                  <strong className="text-slate-900 font-extrabold">
                    ৳{deleteConfirm.label}
                  </strong>
                  ? This will update your calculated net metrics. This action is irreversible.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="h-12 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-rose-500"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Record</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
