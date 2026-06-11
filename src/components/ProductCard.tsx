"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingBag, CreditCard } from "lucide-react";
import { useCartStore, useCartState } from "@/store/useCartStore";

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    images: unknown; // JSON representation of string[]
    ageGroup: string;
    stock: number;
    benefits: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const isWishlisted = useCartState(
    (state) => state.isInWishlist(product.id),
    false
  );

  // Parse images array safely
  let imageUrls: string[] = [];
  try {
    if (Array.isArray(product.images)) {
      imageUrls = product.images;
    } else if (typeof product.images === "string") {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        imageUrls = parsed;
      }
    }
  } catch {
    // Fail silently
  }

  // Determine primary image and handle fallback
  const displayImage = imageUrls.length > 0 ? imageUrls[0] : "/logo.jpg";
  const [imgSrc, setImgSrc] = useState(displayImage);

  // Format price
  const formattedPrice = `৳${product.price}`;

  // Age group badge display
  const displayAge = product.ageGroup.toLowerCase().startsWith("age")
    ? product.ageGroup
    : `Ages ${product.ageGroup}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: imgSrc,
      stock: product.stock,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: imgSrc,
      stock: product.stock,
    });
    
    router.push("/checkout");
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xs transition-all duration-300 hover:scale-[1.02] hover:border-brand-blue/20 hover:shadow-md hover:shadow-brand-blue-light/50">
      {/* Image Container with Badges */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc("/logo.jpg")}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Age Group Badge */}
        <span className="absolute top-3 left-3 z-10 rounded-full bg-brand-blue-light/95 px-2.5 py-1 text-xs font-bold text-brand-blue shadow-xs backdrop-blur-xs">
          {displayAge}
        </span>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-xs transition-all duration-300 hover:scale-110 hover:bg-white active:scale-95 hover:text-red-500"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-5 w-5 transition-colors duration-300 ${
              isWishlisted ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col pt-3">
        {/* Rating Display */}
        <div className="mb-1.5 flex items-center gap-1">
          <div className="flex items-center text-brand-yellow">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-600">4.8</span>
          <span className="text-[11px] text-slate-400">(24)</span>
        </div>

        {/* Title & Benefits */}
        <Link href={`/product/${product.slug}`} className="group-hover:text-brand-blue">
          <h3 className="line-clamp-1 font-sans text-base font-bold text-slate-800 transition-colors">
            {product.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
          {product.benefits}
        </p>

        {/* Price & Action */}
        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-sans text-lg font-extrabold text-brand-blue-dark">
              {formattedPrice}
            </span>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-[10px] font-bold text-orange-500">
                Only {product.stock} left!
              </span>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            {/* Add to Cart Button (Outline style) */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex h-11 items-center justify-center gap-1 rounded-xl border border-brand-blue bg-white text-[10px] sm:text-xs font-bold text-brand-blue shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-light/10 active:scale-98 disabled:pointer-events-none disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            {/* Buy Now Button (Solid brand color) */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 flex h-11 items-center justify-center gap-1 rounded-xl bg-brand-blue text-[10px] sm:text-xs font-bold text-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark hover:shadow-md active:scale-98 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {product.stock === 0 ? "Out of Stock" : "Buy Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
