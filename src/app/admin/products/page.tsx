import prisma from "@/lib/db";
import ProductManagementClient from "./ProductManagementClient";
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

  // Super Admin has master bypass; Sub Admin requires MANAGE_PRODUCTS permission
  if (role !== Role.SUPER_ADMIN && (role !== Role.SUB_ADMIN || !permissions.includes("MANAGE_PRODUCTS"))) {
    redirect("/admin");
  }

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  // Cast JSON images attribute safely to string[] for client typescript
  const formattedProducts = products.map((product) => ({
    ...product,
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
  }));

  return (
    <ProductManagementClient
      initialProducts={formattedProducts}
      categories={categories}
    />
  );
}
