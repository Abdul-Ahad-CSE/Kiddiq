"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export async function getOrdersByPhone(phone: string) {
  try {
    const phoneSchema = z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Invalid Bangladeshi mobile number format");
    const validationResult = phoneSchema.safeParse(phone);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Invalid phone number format",
      };
    }

    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^(?:\+88|88)/, '');
    const orders = await prisma.order.findMany({
      where: {
        phone: {
          contains: normalizedPhone
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        createdAt: true,
        amountPaid: true,
        orderStatus: true,
        items: true
      }
    });

    return { success: true, orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getCustomerOrders() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        createdAt: true,
        amountPaid: true,
        orderStatus: true,
        items: true
      }
    });

    return { success: true, orders };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
