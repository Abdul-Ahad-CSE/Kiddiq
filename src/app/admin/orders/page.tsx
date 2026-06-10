import { getAdminOrders } from "@/app/actions/admin-orders";
import OrdersGridView from "./OrdersGridView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    verify?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions || [];

  if (role !== Role.SUPER_ADMIN && (role !== Role.SUB_ADMIN || !permissions.includes("MANAGE_ORDERS"))) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const verify = resolvedParams.verify || "";
  const status = resolvedParams.status || "";
  const page = parseInt(resolvedParams.page || "1", 10) || 1;

  const data = await getAdminOrders({
    search,
    verificationStatus: verify,
    orderStatus: status,
    page,
    limit: 10,
  });

  return (
    <OrdersGridView
      initialData={data}
      search={search}
      verify={verify}
      status={status}
    />
  );
}
