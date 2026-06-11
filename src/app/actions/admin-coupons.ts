"use server";

import prisma from "@/lib/db";
import { verifySessionAndPermissions } from "@/lib/auth-utils";
import { logAdminAction } from "./audit-log";

export async function createCoupon(data: {
  code: string;
  discountPercent: number;
  minOrderAmount: number;
}) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);
    const code = data.code.trim().toUpperCase();

    if (!code) {
      return { success: false, error: "Coupon code cannot be empty." };
    }
    if (data.discountPercent <= 0 || data.discountPercent > 100) {
      return { success: false, error: "Discount percent must be greater than 0 and less than or equal to 100." };
    }
    if (data.minOrderAmount < 0) {
      return { success: false, error: "Minimum order amount must be non-negative." };
    }

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (existingCoupon) {
      return { success: false, error: "Coupon code already exists." };
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountPercent: data.discountPercent,
        minOrderAmount: data.minOrderAmount,
        isActive: true,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role,
      "CREATE_COUPON",
      "Coupon",
      coupon.id,
      { code, discountPercent: data.discountPercent, minOrderAmount: data.minOrderAmount }
    );

    return { success: true, coupon };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return { success: false, error: message };
  }
}

export async function updateCoupon(
  id: string,
  data: {
    discountPercent?: number;
    minOrderAmount?: number;
    isActive?: boolean;
  }
) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return { success: false, error: "Coupon not found." };
    }

    if (data.discountPercent !== undefined && (data.discountPercent <= 0 || data.discountPercent > 100)) {
      return { success: false, error: "Discount percent must be greater than 0 and less than or equal to 100." };
    }
    if (data.minOrderAmount !== undefined && data.minOrderAmount < 0) {
      return { success: false, error: "Minimum order amount must be non-negative." };
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    await logAdminAction(
      session.user.email!,
      session.user.role,
      "UPDATE_COUPON",
      "Coupon",
      id,
      data
    );

    return { success: true, coupon: updatedCoupon };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon";
    return { success: false, error: message };
  }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return { success: false, error: "Coupon not found." };
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { isActive },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role,
      "TOGGLE_COUPON",
      "Coupon",
      id,
      { isActive }
    );

    return { success: true, coupon: updatedCoupon };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle coupon status";
    return { success: false, error: message };
  }
}

export async function deleteCoupon(id: string) {
  try {
    const session = await verifySessionAndPermissions(["MANAGE_FINANCE"]);

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return { success: false, error: "Coupon not found." };
    }

    await prisma.coupon.delete({
      where: { id },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role,
      "DELETE_COUPON",
      "Coupon",
      id,
      {}
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon";
    return { success: false, error: message };
  }
}

export async function validateCouponCode(code: string, subtotal: number) {
  try {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return { success: false, error: "Coupon code is empty." };
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    if (!coupon) {
      return { success: false, error: "Coupon code not found." };
    }

    if (!coupon.isActive) {
      return { success: false, error: "This coupon is inactive." };
    }

    if (subtotal < coupon.minOrderAmount) {
      return {
        success: false,
        error: `Add ৳${coupon.minOrderAmount - subtotal} more to use this coupon.`,
      };
    }

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        minOrderAmount: coupon.minOrderAmount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate coupon";
    return { success: false, error: message };
  }
}
