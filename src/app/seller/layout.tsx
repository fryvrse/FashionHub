import React from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SellerSidebarNav } from "@/components/seller-sidebar-nav";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getCurrentSession();

  // Strict RBAC & Tenant check
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    redirect("/");
  }

  const store = db.getStoreById(session.storeId);
  if (!store) {
    redirect("/");
  }

  const analytics = db.getStoreAnalytics(session.storeId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <SellerSidebarNav
        store={store}
        newOrdersCount={analytics.newOrdersCount}
        productsCount={analytics.activeProductsCount}
      />
      <div>{children}</div>
    </div>
  );
}

