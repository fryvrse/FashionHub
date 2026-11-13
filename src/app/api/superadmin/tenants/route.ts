import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db, prisma } from "@/lib/prisma";
import { StoreStatusType } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya SUPERADMIN yang dapat memoderasi tenant." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { storeId, status, isOfficialStore } = body as {
      storeId: string;
      status?: StoreStatusType;
      isOfficialStore?: boolean;
    };

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId wajib diisi." },
        { status: 400 }
      );
    }

    void prisma.store
      .update({
        where: { id: storeId },
        data: {
          ...(status ? { status } : {}),
          ...(typeof isOfficialStore === "boolean" ? { isOfficialStore } : {}),
        },
      })
      .catch(() => {
        // Fallback to persistent snapshot when local MySQL is offline
      });

    const updated = db.updateStoreStatus({
      storeId,
      status,
      isOfficialStore,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Tenant tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      stores: db.getAllStores(),
      metrics: db.getSuperadminExecutiveMetrics(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui status tenant." },
      { status: 500 }
    );
  }
}

