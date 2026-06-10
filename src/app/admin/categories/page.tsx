import prisma from "@/lib/db";
import CategoryManagementClient from "./CategoryManagementClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions || [];

  // Super Admin has master bypass; Sub Admin requires MANAGE_CATEGORIES permission
  if (role !== Role.SUPER_ADMIN && (role !== Role.SUB_ADMIN || !permissions.includes("MANAGE_CATEGORIES"))) {
    redirect("/admin");
  }

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return <CategoryManagementClient initialCategories={categories} />;
}
