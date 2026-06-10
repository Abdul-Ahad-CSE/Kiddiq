import { getAdminOrders } from "@/app/actions/admin-orders";
import OrdersGridView from "./OrdersGridView";

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
