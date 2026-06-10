"use server";

import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";

export async function getAdminMetrics() {
  await verifySessionAndPermissions(["VIEW_DASHBOARD"]);

  // 1. totalSales: Sum of amountPaid of all Order records where verificationStatus === 'verified'.
  const salesAgg = await prisma.order.aggregate({
    where: {
      verificationStatus: "verified",
    },
    _sum: {
      amountPaid: true,
    },
  });
  const totalSales = salesAgg._sum.amountPaid || 0;

  // 2. activeOrdersCount: Count of Order records where orderStatus is NOT delivered and NOT cancelled.
  const activeOrdersCount = await prisma.order.count({
    where: {
      orderStatus: {
        notIn: ["delivered", "cancelled"],
      },
    },
  });

  // 3. totalCustomersCount: Count of User records where role === 'CUSTOMER'.
  const totalCustomersCount = await prisma.user.count({
    where: {
      role: "CUSTOMER",
    },
  });

  // 4. revenueTrend: Daily sales for the last 30 days.
  // Generate 30 days of dates in UTC (from 29 days ago to today)
  const today = new Date();
  const dates: string[] = [];
  const trendMap: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dates.push(dateStr);
    trendMap[dateStr] = 0;
  }

  // Query all orders verified and created on or after the start of our first date
  const firstDateParts = dates[0].split("-");
  const startDate = new Date(
    Date.UTC(
      parseInt(firstDateParts[0], 10),
      parseInt(firstDateParts[1], 10) - 1,
      parseInt(firstDateParts[2], 10),
      0,
      0,
      0,
      0
    )
  );

  const ordersForTrend = await prisma.order.findMany({
    where: {
      verificationStatus: "verified",
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      amountPaid: true,
      createdAt: true,
    },
  });

  for (const order of ordersForTrend) {
    const dateStr = order.createdAt.toISOString().split("T")[0];
    if (dateStr in trendMap) {
      trendMap[dateStr] += order.amountPaid;
    }
  }

  const revenueTrend = dates.map((date) => ({
    date,
    sales: trendMap[date],
  }));

  // 5. categoryMix: Map the sales split across categories.
  // Retrieve all verified orders
  const verifiedOrders = await prisma.order.findMany({
    where: {
      verificationStatus: "verified",
    },
    select: {
      items: true,
    },
  });

  // Query all products with their categories
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  const productCategoryMap: Record<string, string> = {};
  for (const p of products) {
    productCategoryMap[p.id] = p.category?.name || "Uncategorized";
  }

  const categoryMixMap: Record<string, number> = {};

  interface OrderItem {
    id: string;
    title: string;
    price: number;
    quantity: number;
  }

  for (const order of verifiedOrders) {
    const items = order.items as unknown as OrderItem[];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === "object") {
          const productId = item.id;
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 0;
          const itemSales = price * quantity;

          const categoryName = productCategoryMap[productId] || "Uncategorized";
          categoryMixMap[categoryName] = (categoryMixMap[categoryName] || 0) + itemSales;
        }
      }
    }
  }

  const categoryMix = Object.entries(categoryMixMap).map(([category, sales]) => ({
    category,
    sales,
  }));

  return {
    totalSales,
    activeOrdersCount,
    totalCustomersCount,
    revenueTrend,
    categoryMix,
  };
}
