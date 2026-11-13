import React from "react";
import { redirect } from "next/navigation";
import { ShieldCheck, Database } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/prisma";
import { SuperadminNav } from "@/components/superadmin-nav";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getCurrentSession();

  if (session.role !== "SUPERADMIN") {
    redirect("/?guard=unauthorized_buyer");
  }

  const metrics = db.getSuperadminExecutiveMetrics();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      {/* Superadmin Editorial Monolith Header */}
      <div className="bg-[#0A0A0A] text-white border border-[#0A0A0A] p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#185B37] text-white font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                SUPERADMIN CONTROL PANEL • LEVEL 1 RBAC
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-neutral-700 text-neutral-300">
                <Database className="w-3 h-3" />
                MYSQL GLOBAL AGGREGATION
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight text-white">
              FashionHub Executive Governance &amp; Oversight
            </h1>
            <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
              Otoritas pengelolaan ekosistem multi-tenant: pantau{" "}
              <strong className="text-white">
                GMV &amp; Komisi Platform ({metrics.commissionRatePercent}%)
              </strong>
              , setujui tenant baru (
              <code className="font-mono text-neutral-200">PENDING</code> →{" "}
              <code className="font-mono text-[#185B37]">ACTIVE</code>), kelola
              direktori RBAC, cairkan dana <strong className="text-white">Escrow</strong>,
              dan kendalikan kampanye <strong className="text-white">Flash Sale Global</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 text-right">
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                TOTAL ESCROW TERTAHAN
              </span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                Rp {metrics.totalEscrowBalance.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 text-right">
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                KATALOG PUBLIK AKTIF
              </span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {metrics.activeCatalogProductsCount} / {metrics.totalProductsCount} SKU
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation across the 5 Superadmin Modules */}
      <SuperadminNav
        pendingStoresCount={metrics.pendingStoresCount}
        pendingWithdrawalsCount={metrics.pendingWithdrawalsCount}
        totalUsersCount={metrics.totalUsersCount}
      />

      {/* Module Content */}
      <div>{children}</div>
    </div>
  );
}
