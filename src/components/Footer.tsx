import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  CreditCard, 
  MessageSquare, 
  CheckCircle2 
} from "lucide-react";

export default function Footer() {
  const categories = [
    { name: "Educational Toys", slug: "educational-toys" },
    { name: "School Supplies", slug: "school-supplies" },
    { name: "Parenting Resources", slug: "parenting-resources" }
  ];

  const whatsappLink = "https://wa.me/8801825462039";

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      
      {/* High-Trust Value Banner */}
      <div className="mx-auto max-w-7xl border-b border-slate-800 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <div className="flex items-start gap-3.5 bg-slate-800/40 p-4 rounded-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/20 text-brand-blue">
              <Truck className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Flat Shipping Rates</h4>
              <p className="mt-1 text-xs text-slate-400">
                ৳60 inside Chittagong City • ৳120 for nationwide outside delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-slate-800/40 p-4 rounded-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/10 text-brand-yellow">
              <CreditCard className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hybrid Payments</h4>
              <p className="mt-1 text-xs text-slate-400">
                Advance delivery fee + Cash On Delivery (COD) OR Full Advance Payment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 bg-slate-800/40 p-4 rounded-xl sm:col-span-2 lg:col-span-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">WhatsApp Order Help</h4>
              <p className="mt-1 text-xs text-slate-400">
                Instant prefilled checkout redirectional order assistance 24/7.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Links & Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg">
                <Image 
                  src="/logo.jpg" 
                  alt="Kiddiq Brand Logo" 
                  fill
                  className="object-cover" 
                />
              </div>
              <span className="font-sans text-xl font-extrabold tracking-tight text-white">
                Kiddiq
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Kiddiq specializes in premium, children&apos;s brain development toys, supplies, and tools designed to inspire creativity, memory, and cognitive growth.
            </p>
            
            {/* Payment Trust Logomarks */}
            <div className="mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                Supported Mobile Wallets
              </span>
              <div className="flex gap-2">
                <div className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                  bKash Personal
                </div>
                <div className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                  Nagad Personal
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid (Flat) */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-4">
              Our Catalog
            </h3>
            <ul className="space-y-2.5 text-xs">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link 
                    href={`/shop?category=${category.slug}`}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="text-slate-400 transition-colors hover:text-white">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Guidelines & Info */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white uppercase mb-4">
              Shopping Guide
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Confirm Order via WhatsApp</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Manual Verification Code</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>Advance Delivery Charge</span>
              </li>
              <li>
                <Link href="/login" className="text-slate-400 transition-colors hover:text-white">
                  Admin Verification Area
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Direct WhatsApp Button */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">
              Get In Touch
            </h3>
            <div className="flex flex-col gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-sky-400" />
                <span>Chittagong, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-sky-400" />
                <span>support@kiddiq.com</span>
              </div>
            </div>

            {/* Direct WhatsApp Call to Action */}
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500 hover:shadow-md active:scale-98"
            >
              <Phone className="h-4 w-4" />
              <span>WhatsApp: 01825462039</span>
            </a>
          </div>

        </div>
      </div>

      {/* Copyright & Subfooter */}
      <div className="bg-slate-950/80 py-6">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kiddiq Store. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-slate-600">Premium Children&apos;s Toys & Brain Development Kits</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
