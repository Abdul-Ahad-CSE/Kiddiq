import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TrackOrderClient from "./TrackOrderClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Order | Kiddiq",
  description: "Track your Kiddiq order status and delivery updates.",
};

export default async function TrackOrderPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
        </div>
      }
    >
      <TrackOrderClient isLoggedIn={isLoggedIn} />
    </Suspense>
  );
}
