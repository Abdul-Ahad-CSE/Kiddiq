import { getAdminMetrics } from "@/app/actions/admin-metrics";
import prisma from "@/lib/db";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import Link from "next/link";

// Force dynamic rendering as it reads real-time DB metrics
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  // Fetch recent orders directly from database for the recent activity section
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      customerName: true,
      amountPaid: true,
      verificationStatus: true,
      orderStatus: true,
      createdAt: true,
    },
  });

  // 1. KPI Cards data
  const kpis = [
    {
      title: "Total Sales",
      value: `৳${metrics.totalSales.toLocaleString("en-IN")}`,
      description: "Sum of verified store sales",
      icon: DollarSign,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      accentBg: "bg-emerald-600",
    },
    {
      title: "Active Orders",
      value: metrics.activeOrdersCount.toString(),
      description: "Orders currently in progress",
      icon: ShoppingBag,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      accentBg: "bg-amber-600",
    },
    {
      title: "Total Customers",
      value: metrics.totalCustomersCount.toLocaleString(),
      description: "Registered customer accounts",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      accentBg: "bg-blue-600",
    },
  ];

  // 2. Custom SVG Chart configuration
  const maxSales = Math.max(...metrics.revenueTrend.map((t) => t.sales), 1000);
  
  // Grid layout geometry
  const width = 800;
  const height = 280;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = 200; // Exact scale factor of 200 as requested: (sales / maxSales) * 200
  
  const colWidth = chartWidth / 30;
  const barWidth = colWidth * 0.6;
  const gap = colWidth * 0.4;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  
  const formatTick = (val: number) => {
    if (val >= 100000) return `৳${(val / 1000).toFixed(0)}k`;
    if (val >= 1000) return `৳${(val / 1000).toFixed(1)}k`;
    return `৳${val}`;
  };

  // 3. Category Mix distribution
  const totalCategorySales = metrics.categoryMix.reduce((acc, c) => acc + c.sales, 0) || 1;
  const categoryContributions = metrics.categoryMix.map((c) => {
    const percentage = (c.sales / totalCategorySales) * 100;
    return {
      ...c,
      percentage,
    };
  }).sort((a, b) => b.sales - a.sales);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Dashboard Overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Real-time performance metrics for Kiddiq storefront
          </p>
        </div>
        
        {/* Refresh Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Sync Active
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              className={`bg-white border-2 ${kpi.borderColor} rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md flex items-center justify-between group`}
            >
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {kpi.value}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {kpi.description}
                </p>
              </div>
              <div className={`h-14 w-14 rounded-xl ${kpi.bgColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0`}>
                <Icon className={`h-7 w-7 ${kpi.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Analytics Section - SVG Chart & Category Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SVG Daily Revenue Trend Chart (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Revenue Trend (Last 30 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Daily sales totals in BDT across verified transactions
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              <TrendingUp className="h-3.5 w-3.5" />
              Sales Active
            </div>
          </div>

          {/* Clean responsive SVG canvas */}
          <div className="w-full overflow-x-auto relative">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full min-w-[700px] h-auto font-sans"
              role="img"
              aria-label="Revenue Trend Chart"
            >
              {/* Horizontal Grid lines and Y ticks */}
              {yTicks.map((tick) => {
                const gridY = paddingTop + chartHeight - tick * chartHeight;
                const tickValue = tick * maxSales;
                return (
                  <g key={tick} className="opacity-90">
                    <line 
                      x1={paddingLeft} 
                      y1={gridY} 
                      x2={width - paddingRight} 
                      y2={gridY} 
                      stroke="#E2E8F0" 
                      strokeWidth={tick === 0 ? "1.5" : "1"}
                      strokeDasharray={tick === 0 ? undefined : "4 4"} 
                    />
                    <text 
                      x={paddingLeft - 10} 
                      y={gridY + 4} 
                      textAnchor="end" 
                      className="text-[10px] fill-slate-400 font-semibold font-sans"
                    >
                      {formatTick(tickValue)}
                    </text>
                  </g>
                );
              })}

              {/* Chart Bars */}
              {metrics.revenueTrend.map((day, i) => {
                const x = paddingLeft + i * colWidth + gap / 2;
                const yHeight = (day.sales / maxSales) * chartHeight;
                const y = paddingTop + chartHeight - yHeight;
                
                // Rounded corner math
                const r = Math.min(3, yHeight);
                const pathD = yHeight > 0 
                  ? `M ${x},${y + yHeight} V ${y + r} A ${r},${r} 0 0 1 ${x + r},${y} H ${x + barWidth - r} A ${r},${r} 0 0 1 ${x + barWidth},${y + r} V ${y + yHeight} Z`
                  : "";

                const dateObj = new Date(day.date);
                const dayStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const showLabel = i % 5 === 0 || i === 29;

                return (
                  <g key={day.date} className="group cursor-pointer">
                    {/* Native Tooltip */}
                    <title>{`${dayStr}: ৳${day.sales.toLocaleString()}`}</title>
                    
                    {/* Bar path */}
                    {yHeight > 0 && (
                      <path 
                        d={pathD}
                        className="fill-blue-500 hover:fill-blue-600 transition-all duration-300"
                      />
                    )}

                    {/* Zero value indicator placeholder */}
                    {yHeight === 0 && (
                      <rect
                        x={x}
                        y={paddingTop + chartHeight - 2}
                        width={barWidth}
                        height={2}
                        className="fill-slate-200 group-hover:fill-slate-300"
                      />
                    )}

                    {/* X-axis tick & label */}
                    {showLabel && (
                      <g className="transition-opacity">
                        <line 
                          x1={x + barWidth / 2} 
                          y1={paddingTop + chartHeight} 
                          x2={x + barWidth / 2} 
                          y2={paddingTop + chartHeight + 6} 
                          stroke="#CBD5E1" 
                          strokeWidth="1.5" 
                        />
                        <text 
                          x={x + barWidth / 2} 
                          y={paddingTop + chartHeight + 20} 
                          textAnchor="middle" 
                          className="text-[9px] fill-slate-400 font-bold font-sans tracking-tight"
                        >
                          {dayStr}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Category Sales Mix & Channel Indicators (1/3 width on desktop) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Sales Mix by Category
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                LTD Sales Split
              </span>
            </div>

            {/* Category Mix List */}
            {categoryContributions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No category sales recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryContributions.map((cat, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{cat.category}</span>
                      <span className="text-slate-500 font-medium">
                        ৳{cat.sales.toLocaleString("en-IN")} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    
                    {/* Horizontal Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 
                            ? "bg-blue-600" 
                            : index === 1 
                            ? "bg-emerald-500" 
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simple Channel Distribution Meter */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Source Indicators
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500">Storefront Web</p>
                <p className="text-lg font-black text-slate-800 mt-1">100%</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center opacity-60">
                <p className="text-xs font-semibold text-slate-500">Social Sales</p>
                <p className="text-lg font-black text-slate-800 mt-1">0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Full width ledger) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Store Activity
            </h3>
            <p className="text-xs text-slate-500">
              Overview of the most recently placed transactions and ledger events
            </p>
          </div>
          
          <Link 
            href="/admin/orders" 
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 min-h-[48px] px-3 transition-colors focus:outline-none focus:underline"
          >
            Manage Orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Order ID</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6">Verify Status</th>
                <th className="py-4 px-6">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No orders exist in the database.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  
                  // Verification Badge
                  let verifyBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </span>
                  );
                  if (order.verificationStatus === "verified") {
                    verifyBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    );
                  } else if (order.verificationStatus === "rejected") {
                    verifyBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    );
                  }

                  // Order Status Badge
                  let orderBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                  if (order.orderStatus === "confirmed") orderBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                  if (order.orderStatus === "processing") orderBadgeClass = "bg-orange-50 text-orange-700 border-orange-200";
                  if (order.orderStatus === "shipped") orderBadgeClass = "bg-teal-50 text-teal-700 border-teal-200";
                  if (order.orderStatus === "delivered") orderBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  if (order.orderStatus === "cancelled") orderBadgeClass = "bg-red-50 text-red-700 border-red-200";

                  const cleanStatus = order.orderStatus.replace("_", " ");

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {order.customerName}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-900 font-sans">
                        ৳{order.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        {verifyBadge}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${orderBadgeClass}`}>
                          {cleanStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
