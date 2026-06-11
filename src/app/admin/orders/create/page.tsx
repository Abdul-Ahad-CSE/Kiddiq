import { verifySessionAndPermissions } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import CreateOrderClient from "./CreateOrderClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CreateOrderPage() {
  try {
    await verifySessionAndPermissions(["MANAGE_ORDERS"]);
  } catch {
    redirect("/admin");
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      stock: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const chattogramAreas = await prisma.deliveryArea.findMany({
    where: {
      district: "Chattogram",
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <CreateOrderClient
      products={products}
      chattogramAreas={chattogramAreas.map((a) => a.name)}
    />
  );
}
