"use server";

import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";
import { z } from "zod";

const investmentSchema = z.object({
  person: z.string().min(1, "Person name is required"),
  amount: z.number().positive("Amount must be a positive number"),
  comment: z.string().min(1, "Comment is required"),
  date: z.preprocess((val) => (val ? new Date(val as string | number | Date) : new Date()), z.date()).optional(),
});

const expenseSchema = z.object({
  paidBy: z.string().min(1, "Paid by is required"),
  amount: z.number().positive("Amount must be a positive number"),
  invoiceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  comment: z.string().min(1, "Comment is required"),
  date: z.preprocess((val) => (val ? new Date(val as string | number | Date) : new Date()), z.date()).optional(),
});

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

// ==========================================
// INVESTMENT CRUD ACTIONS
// ==========================================

export async function createInvestment(data: {
  person: string;
  amount: number;
  comment: string;
  date?: string | Date;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);
    const validated = investmentSchema.parse(data);

    const investment = await prisma.investment.create({
      data: {
        person: validated.person.trim(),
        amount: validated.amount,
        comment: validated.comment.trim(),
        date: validated.date || new Date(),
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_INVESTMENT",
      "Investment",
      investment.id,
      { person: investment.person, amount: investment.amount }
    );

    return { success: true, data: investment };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Failed to create investment";
    return { success: false, error: message };
  }
}

export async function getInvestments() {
  try {
    await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const investments = await prisma.investment.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: investments };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch investments";
    return { success: false, error: message };
  }
}

export async function deleteInvestment(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      throw new Error("Investment not found");
    }

    await prisma.investment.delete({
      where: { id },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_INVESTMENT",
      "Investment",
      id,
      { person: investment.person, amount: investment.amount }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete investment";
    return { success: false, error: message };
  }
}

// ==========================================
// EXPENSE CRUD ACTIONS
// ==========================================

export async function createExpense(data: {
  paidBy: string;
  amount: number;
  comment: string;
  invoiceUrl?: string | null;
  date?: string | Date;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);
    const validated = expenseSchema.parse(data);

    const expense = await prisma.expense.create({
      data: {
        paidBy: validated.paidBy.trim(),
        amount: validated.amount,
        comment: validated.comment.trim(),
        invoiceUrl: validated.invoiceUrl || null,
        date: validated.date || new Date(),
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_EXPENSE",
      "Expense",
      expense.id,
      { paidBy: expense.paidBy, amount: expense.amount }
    );

    return { success: true, data: expense };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues[0].message
      : error instanceof Error
        ? error.message
        : "Failed to create expense";
    return { success: false, error: message };
  }
}

export async function getExpenses() {
  try {
    await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: expenses };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch expenses";
    return { success: false, error: message };
  }
}

export async function deleteExpense(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    await prisma.expense.delete({
      where: { id },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_EXPENSE",
      "Expense",
      id,
      { paidBy: expense.paidBy, amount: expense.amount }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return { success: false, error: message };
  }
}

// ==========================================
// SECURE FINANCIAL AGGREGATION
// ==========================================

export async function getFinancialSummary() {
  try {
    await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    // Calculate:
    // 1. Total Invest: Sum of all Investment.amount.
    const investAgg = await prisma.investment.aggregate({
      _sum: {
        amount: true,
      },
    });
    const totalInvest = investAgg._sum.amount || 0;

    // 2. Total Expense: Sum of all Expense.amount.
    const expenseAgg = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
    });
    const totalExpense = expenseAgg._sum.amount || 0;

    // 3. Total Sell: Sum of amountPaid from successful Order records (where verificationStatus === "verified")
    //    plus total of all DirectSale records (sum of quantity * price for each sale).
    const ordersSellAgg = await prisma.order.aggregate({
      where: {
        verificationStatus: "verified",
      },
      _sum: {
        amountPaid: true,
      },
    });
    const ordersSell = ordersSellAgg._sum.amountPaid || 0;

    const directSales = await prisma.directSale.findMany({
      select: {
        productId: true,
        quantity: true,
        price: true,
      },
    });

    let directSalesSell = 0;
    for (const sale of directSales) {
      directSalesSell += sale.quantity * sale.price;
    }

    const totalSell = ordersSell + directSalesSell;

    // 4. Total COGS:
    //    - Fetch all products: prisma.product.findMany({ select: { id: true, costPrice: true } }).
    //    - Build a fast in-memory Lookup Map: costMap = new Map<string, number>(products.map(p => [p.id, p.costPrice])).
    //    - Sum COGS for direct sales: sum(sale.quantity * costMap.get(sale.productId)).
    //    - Sum COGS for verified orders: loop through orders, parse JSON items list, and sum item.quantity * costMap.get(item.id).
    const products = await prisma.product.findMany({
      select: {
        id: true,
        costPrice: true,
      },
    });

    const costMap = new Map<string, number>(
      products.map((p) => [p.id, p.costPrice])
    );

    let totalCogs = 0;

    // Direct Sales COGS
    for (const sale of directSales) {
      const cost = costMap.get(sale.productId) || 0;
      totalCogs += sale.quantity * cost;
    }

    // Verified Orders COGS
    const verifiedOrders = await prisma.order.findMany({
      where: {
        verificationStatus: "verified",
      },
      select: {
        items: true,
      },
    });

    for (const order of verifiedOrders) {
      const items = order.items as unknown as OrderItem[];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === "object") {
            const cost = costMap.get(item.id) || 0;
            const qty = Number(item.quantity) || 0;
            totalCogs += qty * cost;
          }
        }
      }
    }

    // 5. In Hand (Cash Flow): (Total Invest + Total Sell) - Total Expense
    const inHand = (totalInvest + totalSell) - totalExpense;

    // 6. Net Profit: Total Sell - (Total COGS + Total Expense)
    const netProfit = totalSell - (totalCogs + totalExpense);

    return {
      success: true,
      summary: {
        totalInvest,
        totalExpense,
        totalSell,
        totalCogs,
        inHand,
        netProfit,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch financial summary";
    return { success: false, error: message };
  }
}
