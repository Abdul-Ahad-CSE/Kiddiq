"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import ProductCard from "@/components/ProductCard";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ShopCatalogClientProps {
  initialProducts: ProductWithCategory[];
  categories: Category[];
}

export default function ShopCatalogClient({
  initialProducts,
  categories,
}: ShopCatalogClientProps) {
  const searchParams = useSearchParams();

  // Category State
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return searchParams.get("category") || "all";
  });

  // Search State & Debounce
  const [searchVal, setSearchVal] = useState<string>(() => {
    return searchParams.get("search") || "";
  });
  const [debouncedSearch, setDebouncedSearch] = useState<string>(() => {
    return searchParams.get("search") || "";
  });

  // Price State & Debounce
  const [minPriceInput, setMinPriceInput] = useState<number>(0);
  const [maxPriceInput, setMaxPriceInput] = useState<number>(10000);
  const [debouncedMinPrice, setDebouncedMinPrice] = useState<number>(0);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState<number>(10000);

  // Age Groups State
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<Set<string>>(new Set());

  // Sort Option State
  const [sortBy, setSortBy] = useState<string>(() => {
    return searchParams.get("sort") || "newest";
  });

  // Mobile Bottom Sheet Control
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);

  // Synchronize dynamic states back to browser URL silently
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (activeCategory && activeCategory !== "all") {
      params.set("category", activeCategory);
    } else {
      params.delete("category");
    }

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    if (sortBy && sortBy !== "newest") {
      params.set("sort", sortBy);
    } else {
      params.delete("sort");
    }

    const searchStr = params.toString();
    const newUrl = `${window.location.pathname}${searchStr ? `?${searchStr}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [activeCategory, debouncedSearch, sortBy]);

  // 1. Debounce Text Search & Price input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchVal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPriceInput);
      setDebouncedMaxPrice(maxPriceInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [minPriceInput, maxPriceInput]);

  // 2. Extract dynamic unique age groups from database products list
  const availableAgeGroups = useMemo(() => {
    const groups = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.ageGroup) {
        groups.add(p.ageGroup);
      }
    });
    return Array.from(groups).sort();
  }, [initialProducts]);

  // 3. Dynamic Filter & Sort calculations (useMemo)
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Category Filter
        if (activeCategory !== "all") {
          if (product.category?.slug !== activeCategory) {
            return false;
          }
        }

        // Text Search Filter
        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase();
          const matchesTitle = product.title.toLowerCase().includes(query);
          const matchesDesc = product.description.toLowerCase().includes(query);
          const matchesBenefits = product.benefits.toLowerCase().includes(query);
          const matchesSlug = product.slug.toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc && !matchesBenefits && !matchesSlug) {
            return false;
          }
        }

        // Price Filter
        if (product.price < debouncedMinPrice || product.price > debouncedMaxPrice) {
          return false;
        }

        // Age Group Filter
        if (selectedAgeGroups.size > 0 && !selectedAgeGroups.has(product.ageGroup)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return a.price - b.price;
        } else if (sortBy === "price-desc") {
          return b.price - a.price;
        } else if (sortBy === "featured") {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [
    initialProducts,
    activeCategory,
    debouncedSearch,
    debouncedMinPrice,
    debouncedMaxPrice,
    selectedAgeGroups,
    sortBy,
  ]);

  const handleToggleAgeGroup = (group: string) => {
    const next = new Set(selectedAgeGroups);
    if (next.has(group)) {
      next.delete(group);
    } else {
      next.add(group);
    }
    setSelectedAgeGroups(next);
  };

  const handleResetFilters = () => {
    setActiveCategory("all");
    setSearchVal("");
    setMinPriceInput(0);
    setMaxPriceInput(10000);
    setSelectedAgeGroups(new Set());
    setSortBy("newest");
    setIsFilterSheetOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchVal) count++;
    if (minPriceInput > 0 || maxPriceInput < 10000) count++;
    if (selectedAgeGroups.size > 0) count++;
    if (sortBy !== "newest") count++;
    return count;
  }, [searchVal, minPriceInput, maxPriceInput, selectedAgeGroups, sortBy]);

  // Render subcomponents to keep files clean and separated
  const renderFilterPanelContents = () => (
    <div className="space-y-6">
      {/* Text Search */}
      <div>
        <label htmlFor="search-input" className="text-sm font-bold text-slate-700 block mb-2">
          Search Products
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Type search terms..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-10 pr-4 text-sm bg-slate-50 focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-hidden transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Sorting */}
      <div>
        <label htmlFor="sort-select" className="text-sm font-bold text-slate-700 block mb-2">
          Sort By
        </label>
        <div className="relative">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm bg-slate-50 focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-hidden transition-all text-slate-800 cursor-pointer font-bold appearance-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="featured">Best Sellers</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Price Inputs */}
      <div>
        <span className="text-sm font-bold text-slate-700 block mb-2">Price Range</span>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
            <input
              type="number"
              aria-label="Minimum price"
              min="0"
              max="10000"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-7 pr-3 text-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-hidden transition-all text-slate-800"
            />
          </div>
          <span className="text-slate-400 font-bold text-xs uppercase">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
            <input
              type="number"
              aria-label="Maximum price"
              min="0"
              max="10000"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-7 pr-3 text-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-hidden transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Range Slider */}
        <div className="mt-3">
          <input
            type="range"
            aria-label="Maximum price slider"
            min="0"
            max="10000"
            step="50"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue focus:outline-hidden"
          />
        </div>
      </div>

      {/* Age Groups Multi-Select */}
      <div>
        <span className="text-sm font-bold text-slate-700 block mb-2.5">Filter by Age Group</span>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {availableAgeGroups.map((group) => {
            const checked = selectedAgeGroups.has(group);
            return (
              <button
                key={group}
                onClick={() => handleToggleAgeGroup(group)}
                className="flex items-center gap-2.5 w-full text-left py-1 text-sm font-medium text-slate-600 hover:text-slate-800 focus:outline-hidden min-h-[36px]"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    checked
                      ? "bg-brand-blue border-brand-blue text-white"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </div>
                <span>{group}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={handleResetFilters}
          className="w-full min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col flex-1">
      {/* 1. Flat Category Navigation Tabs at top */}
      <div className="sticky top-18 z-20 -mx-4 px-4 bg-slate-50/90 py-3 backdrop-blur-md border-b border-slate-100 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:py-0 sm:border-0 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === "all"
                ? "bg-brand-blue text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50"
            }`}
          >
            All Toys
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.slug)}
              className={`flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === category.slug
                  ? "bg-brand-blue text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Layout Shell */}
      <div className="flex items-start pb-24 md:pb-8">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden md:block w-72 shrink-0 border-r border-slate-100 pr-6 mr-6 bg-white p-6 rounded-2xl shadow-xs border border-slate-100/50 sticky top-28 self-start">
          <h2 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-brand-blue" />
            Filter & Sort
          </h2>
          {renderFilterPanelContents()}
        </aside>

        {/* 3. Product Catalog Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-100/80 rounded-3xl text-center">
              <div className="rounded-full bg-slate-50 p-4 mb-4">
                <SlidersHorizontal className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                No toys found matching your search
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                Try adjusting your sliders, search terms, or resetting your filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="min-h-[44px] px-6 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark font-bold text-sm shadow-xs transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Sticky Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-100 p-4 shadow-xl backdrop-blur-md md:hidden flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-bold block">Current View</span>
          <span className="text-sm font-extrabold text-brand-blue-dark">
            {filteredProducts.length} Product{filteredProducts.length !== 1 && "s"}
          </span>
        </div>
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className="min-h-[44px] flex items-center gap-2 rounded-xl bg-brand-blue px-6 text-sm font-bold text-white hover:bg-brand-blue-dark transition-all shadow-xs"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Search and Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* 5. Mobile Half-Screen Bottom Sheet Modal */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop (semi-transparent, allowing grid view in top half) */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsFilterSheetOpen(false)}
          />

          {/* Bottom Sheet Body */}
          <div className="relative w-full h-[60vh] bg-white rounded-t-3xl border-t border-slate-200/50 shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-y-0">
            {/* Header / Grabber */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4.5 w-4.5 text-brand-blue" />
                <h2 className="text-base font-extrabold text-slate-800">Search and Filter</h2>
              </div>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex items-center justify-center px-4 rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark text-sm font-bold transition-all cursor-pointer min-h-[44px]"
                aria-label="Close and see results"
              >
                See Result
              </button>
            </div>

            {/* Scrollable Filters Contents */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
              {renderFilterPanelContents()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
