import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import StaffManagementClient from "./StaffManagementClient";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.SUPER_ADMIN) {
    redirect("/admin");
  }

  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.SUPER_ADMIN, Role.SUB_ADMIN],
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const serializedStaff = staff.map(user => ({
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    role: user.role,
    permissions: user.permissions || [],
    isActive: user.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Staff & Role Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage administrative accounts, configure granular permissions, and suspend or activate staff access.
        </p>
      </div>

      <StaffManagementClient initialStaff={serializedStaff} currentAdminId={session.user.id} />
    </div>
  );
}
