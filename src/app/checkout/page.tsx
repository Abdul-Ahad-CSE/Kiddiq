import React from "react";
import prisma from "@/lib/db";
import CheckoutWrapper from "./CheckoutWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout | Kiddiq",
  description: "Complete your checkout and secure manual payment verification with bKash or Nagad.",
};

export default async function CheckoutPage() {
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* Title Header */}
      <div className="mb-6 md:mb-8">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Checkout
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue-dark sm:text-4xl">
          Order Checkout
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Please provide your shipping address details and review your order summary below.
        </p>
      </div>

      <CheckoutWrapper chattogramAreas={chattogramAreas} />
    </div>
  );
}
