"use server";

import prisma from "@/lib/db";
import { Prisma, VerificationStatus, OrderStatus } from "@/generated/prisma/client";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";


export async function getAdminOrders(params: {
  search?: string;
  verificationStatus?: string;
  orderStatus?: string;
  page?: number;
  limit?: number;
} = {}) {
  await verifySessionAndPermissions(["MANAGE_ORDERS"]);

  const { search, verificationStatus, orderStatus, page = 1, limit = 10 } = params;

  const where: Prisma.OrderWhereInput = {};

  if (verificationStatus) {
    where.verificationStatus = verificationStatus as VerificationStatus;
  }

  if (orderStatus) {
    where.orderStatus = orderStatus as OrderStatus;
  }

  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { transactionId: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    orders,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

export async function verifyOrderPayment(orderId: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const adminEmail = session.user.email!;
    const adminRole = session.user.role;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        verificationStatus: "verified",
        orderStatus: "confirmed",
      },
    });

    await logAdminAction(
      adminEmail,
      adminRole,
      "VERIFY_PAYMENT",
      "Order",
      orderId,
      { verificationStatus: "verified", orderStatus: "confirmed" }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify order payment";
    return { success: false, error: message };
  }
}

export async function rejectOrderPayment(orderId: string, notes: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const adminEmail = session.user.email!;
    const adminRole = session.user.role;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        verificationStatus: "rejected",
        orderStatus: "pending_verification",
        adminNotes: notes,
      },
    });

    await logAdminAction(
      adminEmail,
      adminRole,
      "REJECT_PAYMENT",
      "Order",
      orderId,
      { verificationStatus: "rejected", orderStatus: "pending_verification", adminNotes: notes }
    );

    return { success: true, order: updatedOrder };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject order payment";
    return { success: false, error: message };
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const adminEmail = session.user.email!;
    const adminRole = session.user.role;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: status,
      },
    });

    await logAdminAction(
      adminEmail,
      adminRole,
      "UPDATE_STATUS",
      "Order",
      orderId,
      { orderStatus: status }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return { success: false, error: message };
  }
}

