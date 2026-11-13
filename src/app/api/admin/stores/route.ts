import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { StoreStatusType } from "../../../../../prisma/seed-data";

export async function PATCH(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Hanya SUPERADMIN yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { storeId, status, isOfficialStore } = body as {
      storeId: string;
      status?: StoreStatusType;
      isOfficialStore?: boolean;
    };

    const ok = db.updateStoreStatus({ storeId, status, isOfficialStore });
    if (!ok) {
      return NextResponse.json(
        { error: "Store tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui status tenant." },
      { status: 500 }
    );
  }
}

