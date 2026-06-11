"use client";

import React from "react";
import nextDynamic from "next/dynamic";

const CheckoutClient = nextDynamic(() => import("./CheckoutClient"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 animate-pulse">
      <div className="lg:col-span-8 bg-slate-100 rounded-3xl h-[600px]" />
      <div className="lg:col-span-4 bg-slate-100 rounded-3xl h-[400px]" />
    </div>
  ),
});

interface CheckoutWrapperProps {
  chattogramAreas: string[];
  userProfile?: {
    name: string;
    email: string;
    phone: string | null;
    district: string | null;
    area: string | null;
    fullAddress: string | null;
  } | null;
}

export default function CheckoutWrapper({ chattogramAreas, userProfile }: CheckoutWrapperProps) {
  return <CheckoutClient chattogramAreas={chattogramAreas} userProfile={userProfile} />;
}
