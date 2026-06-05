import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { FadeIn, StaggerContainer, StaggerItem, Float } from "@/components/FramerWrapper";
import {
  CheckCircle,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Award,
  Activity,
  Truck,
  Phone,
  Star,
  Quote,
} from "lucide-react";

const HERO_IMAGE_PATH = "/logo.jpg";

export default async function Home() {
  // Fetch categories
  const categories = await prisma.category.findMany();

  // Fetch featured products
  const products = await prisma.product.findMany({
    where: { featured: true },
    take: 4,
  });

  // Category specific mapping details
  const getCategoryDetails = (slug: string) => {
    switch (slug) {
      case "educational-toys":
        return {
          description: "High-quality puzzles, shapes, and STEM kits to develop fine motor skills and spatial logic.",
          icon: GraduationCap,
          colorBg: "bg-orange-50 border-orange-100",
          colorBadge: "bg-orange-500/10 text-orange-600",
          hoverShadow: "hover:shadow-orange-500/10 hover:border-orange-300"
        };
      case "school-supplies":
        return {
          description: "Curated stationery, ergonomic backpacks, and non-toxic materials for early schooling.",
          icon: Award,
          colorBg: "bg-emerald-50 border-emerald-100",
          colorBadge: "bg-emerald-500/10 text-emerald-600",
          hoverShadow: "hover:shadow-emerald-500/10 hover:border-emerald-300"
        };
      case "parenting-resources":
        return {
          description: "Expert-written guides and tools for positive coaching and early developmental milestones.",
          icon: ShieldCheck,
          colorBg: "bg-brand-blue-light/50 border-brand-blue-light",
          colorBadge: "bg-brand-blue/10 text-brand-blue",
          hoverShadow: "hover:shadow-brand-blue/10 hover:border-brand-blue/30"
        };
      default:
        return {
          description: "Premium, parent-curated resources for children&apos;s brain development and education.",
          icon: CheckCircle,
          colorBg: "bg-pink-50 border-pink-100",
          colorBadge: "bg-pink-500/10 text-pink-600",
          hoverShadow: "hover:shadow-pink-500/10 hover:border-pink-300"
        };
    }
  };

  const benefitCards = [
    {
      title: "Educational & Skill Building",
      description: "Curated by early educators to ensure cognitive development.",
      icon: GraduationCap,
      bgColor: "bg-orange-50/70 border-orange-100/80 text-orange-600",
    },
    {
      title: "Safe & Child-Friendly",
      description: "100% non-toxic parent-tested materials for worry-free play.",
      icon: ShieldCheck,
      bgColor: "bg-emerald-50/70 border-emerald-100/80 text-emerald-600",
    },
    {
      title: "Carefully Curated",
      description: "Specifically focused on screen-free logic and hands-on fun.",
      icon: CheckCircle,
      bgColor: "bg-brand-blue-light/40 border-brand-blue-light/60 text-brand-blue",
    },
    {
      title: "Supports Child Growth",
      description: "Encourages active developmental learning and problem-solving.",
      icon: Activity,
      bgColor: "bg-pink-50/70 border-pink-100/80 text-pink-600",
    },
    {
      title: "Fast & Reliable Delivery",
      description: "৳60 Chittagong, ৳120 nationwide fast home delivery.",
      icon: Truck,
      bgColor: "bg-amber-50/70 border-amber-100/80 text-amber-600",
    },
  ];

  const testimonials = [
    {
      quote: "My son spends less time on screens and more time solving spatial puzzles now.",
      author: "Mila R.",
      role: "Parent of a 4-year-old",
    },
    {
      quote: "The quality exceeded my expectations. Wooden blocks are durable and clean.",
      author: "Nabil H.",
      role: "Parent of a 2-year-old",
    },
    {
      quote: "Great educational value, and the Chittagong area delivery was very fast.",
      author: "Sadia K.",
      role: "Parent of a 7-year-old",
    },
  ];

  return (
    <div className="w-full bg-slate-50/50 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-white to-slate-50/30">
        {/* Playful background decorative shapes */}
        <div className="absolute top-1/4 left-4 w-48 h-48 rounded-full bg-brand-yellow-light/20 blur-2xl z-0" />
        <div className="absolute top-1/3 right-4 w-64 h-64 rounded-full bg-brand-blue-light/30 blur-3xl z-0" />

        {/* Lightweight SVG Helicopter Animation Loop */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <svg
            viewBox="0 0 120 80"
            className="w-24 h-24 absolute top-6 left-0 animate-fly-loop"
          >
            {/* Tail Rotor */}
            <g transform="translate(15, 35)">
              <circle cx="0" cy="0" r="8" fill="#072e50" className="animate-rotor-spin" />
            </g>
            
            {/* Tail Boom */}
            <path d="M15,35 L45,45 L45,52 L15,42 Z" fill="#f97316" />
            
            {/* Main Body */}
            <ellipse cx="70" cy="50" rx="30" ry="20" fill="#f97316" />
            
            {/* Cockpit Window */}
            <path d="M75,34 C90,34 96,48 96,50 L75,50 Z" fill="white" opacity="0.9" />
            
            {/* Rotor Mast */}
            <rect x="67" y="22" width="6" height="10" fill="#072e50" />
            
            {/* Main Rotor Blades */}
            <g transform="translate(70, 20)">
              <rect x="-35" y="-2" width="70" height="4" rx="2" fill="#072e50" className="animate-main-rotor" />
            </g>
            
            {/* Landing Skids */}
            <line x1="60" y1="68" x2="55" y2="76" stroke="#072e50" strokeWidth="3" />
            <line x1="80" y1="68" x2="85" y2="76" stroke="#072e50" strokeWidth="3" />
            <path d="M45,76 L100,76" stroke="#072e50" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
            
            {/* Hero content: text and CTA stack */}
            <div className="flex flex-col items-start text-left lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-yellow-light text-brand-yellow-dark text-[11px] font-extrabold tracking-wider uppercase mb-5 shadow-xs border border-brand-yellow/10">
                ⭐ Early Childhood Enrichment
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-blue-dark tracking-tight leading-tight font-sans">
                Brain Development <br />
                <span className="text-brand-blue relative inline-block mt-1">
                  Made Fun
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-brand-yellow/30 rounded-full -z-10" />
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl">
                Explore curated educational toys, puzzles, and resources designed to nurture logic, problem-solving, and creativity in early childhood.
              </p>

              {/* CTAs: stacked full-width on mobile, side-by-side on tablet/desktop */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
                <Link
                  href="/shop"
                  className="flex items-center justify-center min-h-[48px] px-8 bg-brand-yellow hover:bg-brand-yellow-dark text-brand-blue-dark font-extrabold rounded-xl transition-all duration-300 shadow-md hover:shadow-brand-yellow-dark/20 hover:-translate-y-0.5 active:scale-98"
                >
                  Shop Now
                </Link>
                <Link
                  href="#categories"
                  className="flex items-center justify-center min-h-[48px] px-8 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-300 shadow-xs hover:border-slate-300 hover:-translate-y-0.5 active:scale-98"
                >
                  Explore Skills
                </Link>
              </div>

              {/* Trust Indicators: mobile-first stacked, responsive grid for tablets+ */}
              <div className="mt-10 w-full pt-6 border-t border-slate-200/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Educational &amp; Skill-Building</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Parent Approved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Safe &amp; Quality Products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Learning Through Play</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual: stacked below text on mobile, floated side-by-side on desktop */}
            <div className="flex items-center justify-center relative mt-10 lg:mt-0 lg:col-span-5 w-full">
              {/* Overlapping background circles for layout depth */}
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#f97316]/5 border border-[#f97316]/10 z-0 animate-pulse" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#10b981]/5 border border-[#10b981]/10 z-0" />
              <div className="absolute top-1/2 -right-6 w-16 h-16 rounded-full bg-[#ec4899]/5 border border-[#ec4899]/10 z-0" />

              <Float className="relative z-10 w-full max-w-[320px] sm:max-w-[360px] flex justify-center">
                <div className="relative w-full aspect-square rounded-[2rem] border-4 border-white bg-brand-blue-light/50 p-6 shadow-xl shadow-brand-blue/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-2 rounded-[1.7rem] border-2 border-dashed border-brand-blue/15 pointer-events-none" />
                  
                  <Image
                    src={HERO_IMAGE_PATH}
                    alt="Kiddiq Childhood Showcase"
                    width={320}
                    height={320}
                    priority
                    className="relative z-10 max-h-full max-w-full rounded-2xl shadow-md border border-slate-100 object-contain aspect-square bg-white p-3 hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </Float>
            </div>

          </div>
        </div>
      </section>

      {/* Best Sellers Section: Order swapped to come BEFORE Category Grid */}
      <section className="py-16 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10">
            <div className="max-w-2xl text-left">
              <span className="text-brand-blue font-extrabold text-xs sm:text-sm uppercase tracking-wider">Top Rated</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-blue-dark tracking-tight mt-1 font-sans">
                Best Sellers
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base">
                Most loved by parents and children.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-brand-blue hover:text-brand-blue-dark font-extrabold text-sm transition-colors min-h-[44px]"
            >
              View All Products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section id="categories" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <span className="text-brand-blue font-extrabold text-xs sm:text-sm uppercase tracking-wider">Categorized Learning</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-blue-dark tracking-tight mt-1 font-sans">
              Discover Learning Goals
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Quickly find the perfect development tools based on skill areas.
            </p>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const details = getCategoryDetails(category.slug);
              const IconComponent = details.icon;
              return (
                <StaggerItem key={category.id} className="group">
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className={`flex flex-col h-full rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xs hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 ${details.hoverShadow} min-h-[44px]`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border ${details.colorBg} ${details.colorBadge}`}>
                        <IconComponent className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-brand-blue-dark transition-colors group-hover:text-brand-blue">
                        {category.name}
                      </h3>
                    </div>

                    <p className="mt-4 text-slate-600 leading-relaxed text-sm flex-1">
                      {details.description}
                    </p>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs sm:text-sm font-extrabold text-brand-blue group-hover:text-brand-blue-dark">
                      Explore Collection
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Parents Choose Kiddiq Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="text-brand-blue font-extrabold text-xs sm:text-sm uppercase tracking-wider font-sans">Our Standards</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-blue-dark tracking-tight mt-1 font-sans">
              Why Parents Trust Kiddiq
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Curated learning aids meeting strict safety and educational standard thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefitCards.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${benefit.bgColor} mb-4`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-slate-500 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}

            {/* Direct WhatsApp Checkout Card - Minimum touch target ensured and fully clickable */}
            <a
              href="https://wa.me/8801825462039"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer min-h-[44px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-900 group-hover:text-emerald-800">
                Direct WhatsApp Checkout
              </h3>
              <p className="mt-2 text-emerald-700 text-sm leading-relaxed flex-1">
                Verify details and prefill orders directly with our support team on WhatsApp.
              </p>
              <div className="mt-4 text-xs font-extrabold text-emerald-600 flex items-center gap-1 group-hover:text-emerald-700">
                Chat with Us Now
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="text-brand-blue font-extrabold text-xs sm:text-sm uppercase tracking-wider">True Stories</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-blue-dark tracking-tight mt-1 font-sans">
              Loved by Parents
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Real feedback from families promoting screen-free logic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute -top-3 -right-3 text-slate-100/60 pointer-events-none">
                  <Quote className="w-14 h-14 transform rotate-180" />
                </div>
                
                <div>
                  <div className="flex gap-0.5 text-brand-yellow mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-brand-yellow text-brand-yellow" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm italic leading-relaxed relative z-10">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="block font-bold text-slate-800 text-sm">{t.author}</span>
                  <span className="block text-slate-400 text-xs mt-0.5">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
