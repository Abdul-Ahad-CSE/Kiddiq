"use server";

import prisma from "@/lib/db";
import { Role, Prisma } from "@/generated/prisma/client";

export async function logAdminAction(
  adminEmail: string,
  adminRole: Role,
  action: string,
  targetModel: string,
  targetId: string,
  changes: Prisma.InputJsonValue
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminEmail,
        adminRole,
        action,
        targetModel,
        targetId,
        changes: changes || {},
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return { success: false, error: "Failed to write audit log" };
  }
}
