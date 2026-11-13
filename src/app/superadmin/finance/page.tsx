import React from "react";
import { db } from "@/lib/prisma";
import { SuperadminFinanceClient } from "@/components/superadmin-finance-client";

export default function SuperadminFinancePage() {
  const orders = db.getOrders();
  const withdrawals = db.getWithdrawals();
  const stores = db.getAllStores();
  const marketing = db.getMarketingConfig();

  return (
    <SuperadminFinanceClient
      initialOrders={orders}
      initialWithdrawals={withdrawals}
      initialStores={stores}
      commissionRatePercent={marketing.commissionRatePercent || 5}
    />
  );
}

