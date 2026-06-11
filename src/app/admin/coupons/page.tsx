import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";
import CouponManagementClient from "./CouponManagementClient";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const permissions = session.user.permissions || [];

  if (
    role !== Role.SUPER_ADMIN &&
    (role !== Role.SUB_ADMIN || !permissions.includes("MANAGE_FINANCE"))
  ) {
    redirect("/admin");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map Decimal or Date fields to serializable props if needed, but they are standard Types in Prisma (Float for discountPercent/minOrderAmount, Date for createdAt/updatedAt)
  const serializedCoupons = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    minOrderAmount: coupon.minOrderAmount,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Coupon & Financial Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create, update, toggle, or delete promotional codes and minimum subtotal rules.
        </p>
      </div>

      <CouponManagementClient initialCoupons={serializedCoupons} />
    </div>
  );
}
