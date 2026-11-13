import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db, prisma } from "@/lib/prisma";
import { WithdrawalStatusType } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya SUPERADMIN yang dapat mencairkan escrow." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { withdrawalId, status, notes } = body as {
      withdrawalId: string;
      status: WithdrawalStatusType;
      notes?: string;
    };

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: "withdrawalId dan status wajib diisi." },
        { status: 400 }
      );
    }

    const processed = db.processWithdrawal({
      withdrawalId,
      status,
      notes,
    });

    if (!processed) {
      return NextResponse.json(
        { error: "Permintaan pencairan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Attempt Prisma MySQL store balance sync if APPROVED
    if (status === "APPROVED") {
      void prisma.store
        .update({
          where: { id: processed.storeId },
          data: {
            balance: processed.store.balance,
          },
        })
        .catch(() => {
          // Fallback to persistent snapshot when local MySQL is offline
        });
    }

    return NextResponse.json({
      success: true,
      withdrawal: processed,
      withdrawals: db.getWithdrawals(),
      stores: db.getAllStores(),
      metrics: db.getSuperadminExecutiveMetrics(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses pencairan saldo escrow." },
      { status: 500 }
    );
  }
}

