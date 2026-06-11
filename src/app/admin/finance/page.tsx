import { Suspense } from "react";
import FinanceDashboardClient from "./FinanceDashboardClient";
import { getFinancialSummary, getInvestments, getExpenses } from "@/app/actions/finance";
import { verifySessionAndPermissions } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);
  const summaryRes = await getFinancialSummary();
  const investmentsRes = await getInvestments();
  const expensesRes = await getExpenses();

  const summary = summaryRes.success && summaryRes.summary
    ? summaryRes.summary
    : { totalInvest: 0, totalExpense: 0, totalSell: 0, totalCogs: 0, inHand: 0, netProfit: 0 };

  const investments = investmentsRes.success && investmentsRes.data
    ? investmentsRes.data
    : [];

  const expenses = expensesRes.success && expensesRes.data
    ? expensesRes.data
    : [];

  const adminEmail = session?.user?.email || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
          <p className="text-sm text-slate-500">
            Monitor corporate cash flow, log capital investments, track operating expenses, and review net margins.
          </p>
        </div>
      </div>
      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceDashboardClient 
          initialSummary={summary} 
          initialInvestments={investments} 
          initialExpenses={expenses}
          adminEmail={adminEmail}
        />
      </Suspense>
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 h-28 flex flex-col justify-between">
            <div className="h-3 w-24 bg-slate-200" />
            <div className="h-6 w-32 bg-slate-200" />
            <div className="h-3 w-16 bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Tabs and Controls Skeleton */}
      <div className="bg-white border border-slate-250 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 w-28 bg-slate-200" />
          <div className="h-10 w-28 bg-slate-200" />
        </div>
        <div className="h-12 w-full sm:w-48 bg-slate-200" />
      </div>

      {/* Table Placeholder */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <div className="h-4 bg-slate-200 w-1/4" />
        <div className="space-y-3">
          <div className="h-10 bg-slate-100 w-full" />
          <div className="h-10 bg-slate-100 w-full" />
          <div className="h-10 bg-slate-100 w-full" />
          <div className="h-10 bg-slate-100 w-full" />
          <div className="h-10 bg-slate-100 w-full" />
        </div>
      </div>
    </div>
  );
}
