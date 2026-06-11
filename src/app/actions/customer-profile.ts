"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, "Please enter a valid Bangladeshi mobile number"),
  district: z.string().min(1, "Please select a district"),
  area: z.string().min(1, "Please select or type an area"),
  fullAddress: z.string().min(5, "Address must be at least 5 characters"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export async function updateProfileDetails(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = profileDetailsSchema.parse(data);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name.trim(),
        phone: validated.phone.trim(),
        district: validated.district.trim(),
        area: validated.area.trim(),
        fullAddress: validated.fullAddress.trim(),
      },
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        district: updatedUser.district,
        area: updatedUser.area,
        fullAddress: updatedUser.fullAddress,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return { success: false, error: message };
  }
}

export async function updateUserPassword(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updatePasswordSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return { success: false, error: "Incorrect current password" };
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]?.message || "Invalid input";
      return { success: false, error: firstError };
    }
    const message = error instanceof Error ? error.message : "Failed to update password";
    return { success: false, error: message };
  }
}
