import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { subOrderId, action, targetStage } = body as {
      subOrderId: string;
      action: "ADVANCE_CHECKPOINT" | "SET_STAGE" | "COMPLETE_ORDER";
      targetStage?: number;
    };

    if (!subOrderId || !action) {
      return NextResponse.json(
        { error: "Parameter subOrderId dan action wajib diisi." },
        { status: 400 }
      );
    }

    const updatedSubOrder = db.advanceOrUpdateSubOrderTracking({
      subOrderId,
      action,
      targetStage,
    });

    if (!updatedSubOrder) {
      return NextResponse.json(
        { error: "SubOrder tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subOrder: updatedSubOrder,
    });
  } catch (error) {
    console.error("Order Tracking API Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pelacakan pengiriman." },
      { status: 500 }
    );
  }
}

