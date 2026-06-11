import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Role } from "@/generated/prisma/client";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.CUSTOMER) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 font-sans">Unauthorized Access</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Only customers are permitted to access this profile dashboard page.
        </p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      district: true,
      area: true,
      fullAddress: true,
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 font-sans">User Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md">
          Your user profile could not be loaded. Please log in again.
        </p>
      </div>
    );
  }

  // Fetch all Chattogram areas from Prisma
  const areas = await prisma.deliveryArea.findMany({
    where: {
      district: "Chattogram",
    },
    orderBy: {
      name: "asc",
    },
  });

  const chattogramAreas = areas.map((a) => a.name);

  return <ProfileClient user={user} chattogramAreas={chattogramAreas} />;
}
