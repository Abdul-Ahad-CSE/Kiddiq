import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import POSDashboardClient from "./POSDashboardClient";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  // 1. Verify admin permissions
  const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
  const cashierEmail = session.user.email || "Unknown";

  // 2. Query products for dropdown selection (only need id, title, price, and current stock)
  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      stock: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  // 3. Query existing direct sales entries
  const sales = await prisma.directSale.findMany({
    include: {
      product: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Direct POS Ledger</h1>
          <p className="text-sm text-slate-500">
            Record walk-in orders, manage direct sales transactions, and monitor real-time stock levels.
          </p>
        </div>
      </div>

      <POSDashboardClient products={products} initialSales={sales} cashierEmail={cashierEmail} />
    </div>
  );
}
