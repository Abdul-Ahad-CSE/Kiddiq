import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";

export async function verifySessionAndPermissions(requiredPermissions: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized: No active session");
  }

  const user = session.user;

  // SUPER_ADMIN has master override to bypass all permissions
  if (user.role === Role.SUPER_ADMIN) {
    return session;
  }

  if (user.role === Role.SUB_ADMIN) {
    // Check if the sub admin has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission)
    );
    if (hasAllPermissions) {
      return session;
    }
  }

  throw new Error("Forbidden: Insufficient permissions");
}
