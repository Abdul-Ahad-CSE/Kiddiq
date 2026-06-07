"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Heart, Phone, Check, Star } from "lucide-react";
import { useCartStore, useCartState } from "@/store/useCartStore";

export interface ProductWithCategory {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  ageGroup: string;
  images: unknown;
  stock: number;
  benefits: string;
  featured: boolean;
  createdAt: Date | string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProductDetailsClientProps {
  product: ProductWithCategory;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const toggleWishlist = useCartStore((state) => state.toggleWishlist);
  const isWishlisted = useCartState((state) => state.isInWishlist(product.id), false);

  // States
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Parse images JSON safely
  let imageUrls: string[] = [];
  try {
    if (Array.isArray(product.images)) {
      imageUrls = product.images as string[];
    } else if (typeof product.images === "string") {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        imageUrls = parsed;
      }
    }
  } catch {
    // Fail silently
  }
  if (imageUrls.length === 0) {
    imageUrls = ["/logo.jpg"];
  }

  // Parse benefits list
  const benefitsList = product.benefits
    ? product.benefits.split(",").map((b) => b.trim()).filter(Boolean)
    : [];

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      image: imageUrls[0] || "/logo.jpg",
      stock: product.stock,
    });
    // Set custom quantity in store
    updateQuantity(product.id, quantity);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
  };

  const handleWhatsAppOrder = () => {
    const formattedPrice = `৳${product.price}`;
    const message = `Hi Kiddiq, I would like to order "${product.title}" (Price: ${formattedPrice}). Please guide me through the next steps for delivery!`;
    const whatsappUrl = `https://wa.me/8801825462039?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Determine stock text and formatting
  let stockLabel = "In Stock";
  let stockClass = "bg-emerald-50 border-emerald-100 text-emerald-600";
  if (product.stock === 0) {
    stockLabel = "Out of Stock";
    stockClass = "bg-rose-50 border-rose-100 text-rose-600";
  } else if (product.stock <= 5) {
    stockLabel = `Only ${product.stock} Left!`;
    stockClass = "bg-orange-50 border-orange-100 text-orange-600";
  }

  const displayAge = product.ageGroup.toLowerCase().startsWith("age")
    ? product.ageGroup
    : `Ages ${product.ageGroup}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xs">
      
      {/* Column 1: Image Carousel (left, takes 5 cols on desktop) */}
      <div className="lg:col-span-6 xl:col-span-5 w-full flex flex-col">
        
        {/* Main image container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 group select-none">
          
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImgIndex}
              src={imageUrls[activeImgIndex]}
              alt={product.title}
              className="h-full w-full object-cover cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                if (info.offset.x > 50) {
                  handlePrevImage();
                } else if (info.offset.x < -50) {
                  handleNextImage();
                }
              }}
            />
          </AnimatePresence>

          {/* Carousel Click Arrows (desktop focus, touch >= 44x44px) */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-xs transition-all hover:scale-105 active:scale-95 hover:bg-white z-10 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-xs transition-all hover:scale-105 active:scale-95 hover:bg-white z-10 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation List (touch targets >= 44x44px) */}
        {imageUrls.length > 1 && (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
            {imageUrls.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer min-h-[44px] min-w-[44px] ${
                  activeImgIndex === idx
                    ? "border-brand-blue shadow-xs"
                    : "border-slate-100 hover:border-slate-300"
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Column 2: Product details copy & actions (right, takes 7 cols on desktop) */}
      <div className="lg:col-span-6 xl:col-span-7 w-full flex flex-col">
        
        {/* Category & Badge Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="text-xs font-extrabold text-brand-blue uppercase tracking-widest hover:text-brand-blue-dark transition-colors"
          >
            {product.category.name}
          </Link>
        </div>

        {/* Product Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-blue-dark tracking-tight font-sans leading-tight">
          {product.title}
        </h1>

        {/* Stars and Price Row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          {/* Price */}
          <span className="text-3xl font-extrabold text-brand-blue-dark font-sans">
            ৳{product.price}
          </span>
          {/* Hardcoded high trust rating to match homepage best sellers */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-brand-yellow">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4.5 w-4.5 fill-brand-yellow text-brand-yellow" />
              ))}
            </div>
            <span className="text-xs font-extrabold text-slate-600 mt-0.5">4.8</span>
            <span className="text-xs text-slate-400 mt-0.5">(24 Parent Reviews)</span>
          </div>
        </div>

        {/* Badges / Meta Info Row */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center rounded-full bg-brand-blue-light/90 px-3.5 py-1 text-xs font-bold text-brand-blue border border-brand-blue-light/50">
            {displayAge}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold ${stockClass}`}>
            {stockLabel}
          </span>
        </div>

        {/* Educational Benefits List */}
        {benefitsList.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3.5 font-sans">
              Developmental &amp; Learning Benefits
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefitsList.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm font-semibold text-slate-600">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="leading-snug">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description Section */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2 font-sans">
            Description
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Action Controls Column */}
        <div className="mt-8 border-t border-slate-100 pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 min-h-[44px] self-start px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex items-center justify-center h-9 w-9 text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-slate-800 text-sm select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="flex items-center justify-center h-9 w-9 text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            {/* Cart & Wishlist Actions */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark font-bold text-sm shadow-xs transition-all duration-200 active:scale-98 disabled:bg-slate-100 disabled:text-slate-400 disabled:pointer-events-none"
              >
                <ShoppingBag className="h-4 w-4" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                onClick={handleToggleWishlist}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isWishlisted
                    ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                    : "border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Direct WhatsApp Quick Order Link */}
          <button
            onClick={handleWhatsAppOrder}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 font-extrabold text-sm transition-all duration-200 active:scale-98 cursor-pointer"
          >
            <Phone className="h-4.5 w-4.5 fill-emerald-700" />
            Order Direct via WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
}
