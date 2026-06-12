import React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pre-order Exclusive Educational Toys & Resources | Kiddiq",
  description: "Secure Kiddiq's coming-soon premium selection of screen-free educational toys, stationery supplies, and developmental tracking resources with a 50% advance payment.",
};

export default async function PreOrdersPage() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PREORDERS === "true";
  if (!isEnabled) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      isPreorder: true,
    },
    omit: {
      costPrice: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* Page Title & Breadcrumb Header */}
      <div className="mb-6 md:mb-8">
        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1 w-fit uppercase tracking-widest block mb-2">
          Pre-orders
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue-dark sm:text-4xl">
          Exclusive Pre-orders
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Secure our upcoming educational products early. Requires a 50% advance payment, with the remainder payable via Cash on Delivery (COD) upon receipt.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center my-8">
          <h3 className="text-base font-semibold text-slate-700 font-sans">No Pre-order Products Available</h3>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Please check back later or explore our standard catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
