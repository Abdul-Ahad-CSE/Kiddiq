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

export interface CreateOmnichannelOrderInput {
  customerName: string;
  phone: string;
  email?: string | null;
  district: string;
  area: string;
  fullAddress: string;
  paymentOption: string;
  paymentMethod: string;
  senderNumber?: string | null;
  transactionId?: string | null;
  verificationStatus: VerificationStatus;
  orderStatus: OrderStatus;
  adminNotes?: string | null;
}

export interface CreateOmnichannelOrderItemInput {
  id: string;
  quantity: number;
}

export async function createOmnichannelOrder(
  data: CreateOmnichannelOrderInput,
  items: CreateOmnichannelOrderItemInput[]
) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_ORDERS"]);
    const adminEmail = session.user.email!;
    const adminRole = session.user.role;

    // 1. Validation
    if (!data.customerName?.trim()) {
      return { success: false, message: "Customer name is required" };
    }
    if (!data.phone?.trim()) {
      return { success: false, message: "Phone number is required" };
    }
    if (!data.district?.trim()) {
      return { success: false, message: "District is required" };
    }
    if (!data.area?.trim()) {
      return { success: false, message: "Area is required" };
    }
    if (!data.fullAddress?.trim()) {
      return { success: false, message: "Full address is required" };
    }
    if (!data.paymentOption?.trim()) {
      return { success: false, message: "Payment option is required" };
    }
    if (!data.paymentMethod?.trim()) {
      return { success: false, message: "Payment method is required" };
    }
    if (!items || items.length === 0) {
      return { success: false, message: "At least one product must be selected" };
    }
    for (const item of items) {
      if (!item.id) {
        return { success: false, message: "Product ID is required for all selected items" };
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return { success: false, message: "Quantity must be at least 1 for all items" };
      }
    }

    const paymentOptionUpper = data.paymentOption.trim().toUpperCase();
    if (paymentOptionUpper !== "COD" && paymentOptionUpper !== "FULL_ADVANCE") {
      return { success: false, message: "Payment option must be COD or FULL_ADVANCE" };
    }

    const finalTransactionId = data.transactionId?.trim() || `OMNI-${data.paymentMethod.toUpperCase().replace(/\s+/g, "_")}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalSenderNumber = data.senderNumber?.trim() || "N/A";

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Check for duplicate transaction ID
      const existingTransaction = await tx.order.findUnique({
        where: { transactionId: finalTransactionId },
      });
      if (existingTransaction) {
        throw new Error(`DUPLICATE_TRANSACTION:${finalTransactionId}`);
      }

      // Fetch products to validate and compute pricing
      const productIds = items.map(item => item.id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      let calculatedSubtotal = 0;
      const serializedItems = [];

      for (const item of items) {
        const dbProduct = dbProducts.find(p => p.id === item.id);
        if (!dbProduct) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.id}`);
        }
        if (dbProduct.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${dbProduct.title}:${dbProduct.stock}`);
        }
        calculatedSubtotal += dbProduct.price * item.quantity;
        serializedItems.push({
          id: dbProduct.id,
          title: dbProduct.title,
          price: dbProduct.price,
          quantity: item.quantity,
        });
      }

      // Decrement stock levels
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Delivery charge lookup
      let deliveryCharge = 120;
      if (data.district.trim() === "Chattogram") {
        const chattogramAreas = await tx.deliveryArea.findMany({
          where: { district: "Chattogram" },
          select: { name: true },
        });
        const areaNames = chattogramAreas.map(a => a.name);
        if (areaNames.includes(data.area.trim())) {
          deliveryCharge = 60;
        }
      }

      // Payments calculations
      let amountPaid = 0;
      let amountDueOnDelivery = 0;
      if (paymentOptionUpper === "COD") {
        amountPaid = deliveryCharge;
        amountDueOnDelivery = calculatedSubtotal;
      } else {
        amountPaid = calculatedSubtotal + deliveryCharge;
        amountDueOnDelivery = 0;
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          customerName: data.customerName.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          district: data.district.trim(),
          area: data.area.trim(),
          fullAddress: data.fullAddress.trim(),
          items: serializedItems as Prisma.InputJsonValue,
          subtotal: calculatedSubtotal,
          deliveryCharge,
          couponCode: null,
          discount: 0,
          paymentOption: paymentOptionUpper,
          paymentMethod: data.paymentMethod.trim(),
          amountPaid,
          amountDueOnDelivery,
          senderNumber: finalSenderNumber,
          transactionId: finalTransactionId,
          verificationStatus: data.verificationStatus,
          orderStatus: data.orderStatus,
          adminNotes: data.adminNotes?.trim() || null,
        },
      });

      return newOrder;
    });

    // Write audit log
    await logAdminAction(
      adminEmail,
      adminRole,
      "CREATE_OMNICHANNEL_ORDER",
      "Order",
      createdOrder.id,
      {
        customerName: createdOrder.customerName,
        phone: createdOrder.phone,
        email: createdOrder.email,
        district: createdOrder.district,
        area: createdOrder.area,
        fullAddress: createdOrder.fullAddress,
        subtotal: createdOrder.subtotal,
        deliveryCharge: createdOrder.deliveryCharge,
        paymentOption: createdOrder.paymentOption,
        paymentMethod: createdOrder.paymentMethod,
        amountPaid: createdOrder.amountPaid,
        amountDueOnDelivery: createdOrder.amountDueOnDelivery,
        senderNumber: createdOrder.senderNumber,
        transactionId: createdOrder.transactionId,
        verificationStatus: createdOrder.verificationStatus,
        orderStatus: createdOrder.orderStatus,
        adminNotes: createdOrder.adminNotes,
      }
    );

    return { success: true, orderId: createdOrder.id };

  } catch (error) {
    const err = error as Error;
    console.error("Omnichannel Order Creation error:", err);

    if (err.message?.startsWith("DUPLICATE_TRANSACTION:")) {
      const txId = err.message.split(":")[1];
      return {
        success: false,
        message: `The Transaction ID "${txId}" has already been used for another order.`,
      };
    }
    if (err.message?.startsWith("INSUFFICIENT_STOCK:")) {
      const parts = err.message.split(":");
      const title = parts[1] || "Product";
      const stock = parts[2] || "0";
      return {
        success: false,
        message: `Product "${title}" has insufficient stock. Only ${stock} items available.`,
      };
    }
    if (err.message?.startsWith("PRODUCT_NOT_FOUND:")) {
      const id = err.message.split(":")[1];
      return {
        success: false,
        message: `Product ID "${id}" could not be found in the database.`,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          message: "The Transaction ID must be unique. An order with this Transaction ID already exists.",
        };
      }
    }

    return {
      success: false,
      message: err.message || "An unexpected error occurred during omnichannel order creation.",
    };
  }
}


