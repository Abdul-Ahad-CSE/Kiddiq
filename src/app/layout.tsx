import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Kiddiq | Premium Children's Brain Development Store",
  description: "Explore Kiddiq's premium brain development toys, educational supplies, and parenting resources designed to nurture intelligence and creativity.",
  keywords: "children toys, brain development, educational toys, parenting resources, school supplies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800">
        <div className="flex min-h-screen flex-col">
          <Navbar session={session} />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
