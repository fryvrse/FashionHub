import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Cormorant_Garamond,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { getCurrentSession } from "@/lib/auth";
import { CartProvider } from "@/context/cart-context";
import { Navbar } from "@/components/navbar";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FASHIONHUB — Curated Multi-Tenant Fashion & Atelier Marketplace",
  description:
    "Platform e-commerce fashion multi-tenant dengan kurasi editorial, RBAC 3 tingkat (SUPERADMIN, STORE_ADMIN, USER), dan Split-Order Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = getCurrentSession();

  return (
    <html
      lang="id"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A] font-sans antialiased selection:bg-[#185B37] selection:text-white">
        <CartProvider>
          <Suspense fallback={<div className="h-20 bg-white border-b border-neutral-200" />}>
            <Navbar currentSession={session} />
          </Suspense>
          <main className="flex-1">{children}</main>
          <footer className="bg-[#0A0A0A] text-neutral-400 border-t border-neutral-900 mt-16 py-10 px-4 text-xs">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="font-serif text-xl font-semibold tracking-tight text-white">
                  FASHIONHUB ATELIER
                </div>
                <p className="text-[11px] text-neutral-400">
                  Curated Multi-Tenant Fashion Commerce • Next.js App Router &amp; Prisma MySQL
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                <span>3-Tier RBAC: SUPERADMIN / STORE_ADMIN / USER</span>
                <span className="text-neutral-700">|</span>
                <span>Row-Level storeId Isolation</span>
                <span className="text-neutral-700">|</span>
                <span className="text-white">Bandung • Jakarta • Surabaya</span>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
