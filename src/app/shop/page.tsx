import React, { Suspense } from "react";
import prisma from "@/lib/db";
import ShopCatalogClient, { ProductWithCategory } from "./ShopCatalogClient";

export const dynamic = "force-dynamic";

// SEO metadata for the catalog page
export const metadata = {
  title: "Shop Educational Toys & Parenting Resources | Kiddiq",
  description: "Browse Kiddiq's premium selection of screen-free educational toys, stationery supplies, and expert-written parenting tracker journals.",
  keywords: "educational toys, kids supplies, parenting books, logic blocks, learning kits, math abacus",
};

export default async function ShopPage() {
  // Parallel Database Queries for SEO-optimized Server-Side Rendering
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* Page Title & Breadcrumb Header */}
      <div className="mb-6 md:mb-8">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
          Catalog
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-blue-dark sm:text-4xl">
          Explore Toys & Resources
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl">
          Find screen-free educational blocks, schools supplies, and developmental tracking journals designed to nurture cognitive growth.
        </p>
      </div>

      {/* Catalog Filters and Product Grid Wrapper with Suspense */}
      <Suspense
        fallback={
          <div className="flex flex-col md:flex-row gap-6 animate-pulse">
            <div className="hidden md:block w-72 h-96 bg-slate-100 rounded-2xl" />
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-2xl h-64" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <ShopCatalogClient initialProducts={products as unknown as ProductWithCategory[]} categories={categories} />
      </Suspense>
    </div>
  );
}
