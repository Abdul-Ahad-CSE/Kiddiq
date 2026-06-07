import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ProductDetailsClient, { ProductWithCategory } from "./ProductDetailsClient";
import { ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO optimization
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!product) {
    return {
      title: "Product Not Found | Kiddiq",
      description: "Explore our premium selection of screen-free educational toys, stationery supplies, and parenting tracker journals.",
    };
  }

  return {
    title: `${product.title} | Kiddiq`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Kiddiq`,
      description: product.description,
      images: Array.isArray(product.images) && product.images.length > 0 
        ? [{ url: String(product.images[0]) }] 
        : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // 1. Fetch Product by Slug on the Server
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      category: true,
    },
  });

  // Handle 404 state if product doesn't exist
  if (!product) {
    notFound();
  }

  // 2. Fetch Related Products (same category, up to 4, excluding current product)
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: {
        not: product.id,
      },
    },
    take: 4,
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Pad the list with featured products from other categories if we have fewer than 4 related items
  let finalRelatedProducts = [...relatedProducts];
  if (finalRelatedProducts.length < 4) {
    const excludedIds = [product.id, ...relatedProducts.map((p) => p.id)];
    const featuredPadding = await prisma.product.findMany({
      where: {
        id: {
          notIn: excludedIds,
        },
        featured: true,
      },
      take: 4 - finalRelatedProducts.length,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    finalRelatedProducts = [...finalRelatedProducts, ...featuredPadding];
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* Breadcrumbs Navigation */}
      <nav className="mb-6 md:mb-8 flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-blue transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/shop" className="hover:text-brand-blue transition-colors">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-blue transition-colors">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-slate-600 truncate max-w-[200px]" aria-current="page">
          {product.title}
        </span>
      </nav>

      {/* Product Details Section (Client Component for interactive features) */}
      <ProductDetailsClient product={product as unknown as ProductWithCategory} />

      {/* Related Products Grid */}
      {finalRelatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-100 pt-16 pb-8">
          <div className="max-w-2xl text-left mb-8">
            <span className="text-brand-blue font-extrabold text-xs sm:text-sm uppercase tracking-wider">
              More to Explore
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-blue-dark tracking-tight mt-1 font-sans">
              Related Products
            </h2>
            <p className="mt-2 text-slate-500 text-sm sm:text-base">
              Nurture more milestones with these handpicked educational items.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {finalRelatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
