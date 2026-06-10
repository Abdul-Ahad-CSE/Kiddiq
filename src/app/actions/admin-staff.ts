"use server";

import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";
import { logAdminAction } from "./audit-log";
import bcrypt from "bcryptjs";

// Helper to verify Super Admin access
async function verifySuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.SUPER_ADMIN) {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return session;
}

const VALID_PERMISSIONS = ["VIEW_DASHBOARD", "MANAGE_ORDERS", "MANAGE_CATEGORIES", "MANAGE_PRODUCTS", "MANAGE_FINANCE"];

export async function createSubAdmin(data: {
  name: string;
  email: string;
  password: string;
  permissions: string[];
}) {
  try {
    const session = await verifySuperAdmin();
    
    // Validate permissions
    const invalidPerms = data.permissions.filter(p => !VALID_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPerms.join(", ")}`);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: Role.SUB_ADMIN,
        permissions: data.permissions,
        isActive: true,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "CREATE_SUB_ADMIN",
      "User",
      newAdmin.id,
      { email: data.email, permissions: data.permissions }
    );

    return { success: true, user: newAdmin };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Sub Admin";
    return { success: false, error: message };
  }
}

export async function updateSubAdminPermissions(
  subAdminId: string,
  permissions: string[]
) {
  try {
    const session = await verifySuperAdmin();

    // Validate permissions
    const invalidPerms = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPerms.join(", ")}`);
    }

    const updatedUser = await prisma.user.update({
      where: { id: subAdminId },
      data: {
        permissions,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "UPDATE_SUB_ADMIN_PERMISSIONS",
      "User",
      subAdminId,
      { permissions }
    );

    return { success: true, user: updatedUser };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update permissions";
    return { success: false, error: message };
  }
}

export async function toggleSubAdminSuspension(
  subAdminId: string,
  isActive: boolean
) {
  try {
    const session = await verifySuperAdmin();

    // Fetch user being modified
    const targetUser = await prisma.user.findUnique({
      where: { id: subAdminId },
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Safeguard: If target is SUPER_ADMIN and we are deactivating them
    if (targetUser.role === Role.SUPER_ADMIN && !isActive) {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: Role.SUPER_ADMIN, isActive: true },
      });
      if (activeSuperAdmins <= 1) {
        throw new Error("Cannot suspend the last remaining active Super Admin");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: subAdminId },
      data: {
        isActive,
      },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "TOGGLE_SUB_ADMIN_STATUS",
      "User",
      subAdminId,
      { isActive }
    );

    return { success: true, user: updatedUser };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle status";
    return { success: false, error: message };
  }
}

export async function deleteSubAdmin(subAdminId: string) {
  try {
    const session = await verifySuperAdmin();

    // Fetch user being deleted
    const targetUser = await prisma.user.findUnique({
      where: { id: subAdminId },
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Safeguard: If target is SUPER_ADMIN
    if (targetUser.role === Role.SUPER_ADMIN) {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: Role.SUPER_ADMIN, isActive: true },
      });
      if (activeSuperAdmins <= 1) {
        throw new Error("Cannot delete the last remaining active Super Admin");
      }
    }

    await prisma.user.delete({
      where: { id: subAdminId },
    });

    await logAdminAction(
      session.user.email!,
      session.user.role!,
      "DELETE_SUB_ADMIN",
      "User",
      subAdminId,
      { email: targetUser.email }
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return { success: false, error: message };
  }
}
