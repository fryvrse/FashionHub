import { NextRequest, NextResponse } from "next/server";
import { db, prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = getCurrentSession();
  if (session.role !== "STORE_ADMIN" || !session.storeId) {
    return NextResponse.json(
      { error: "Unauthorized: Hanya STORE_ADMIN yang diizinkan." },
      { status: 403 }
    );
  }

  const products = db.getProducts({ storeId: session.storeId });
  return NextResponse.json({
    storeId: session.storeId,
    products,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "STORE_ADMIN" || !session.storeId) {
      return NextResponse.json(
        { error: "Unauthorized: Hanya STORE_ADMIN yang diizinkan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      category,
      basePrice,
      discountPrice,
      imageUrl,
      isFeatured,
      variants,
    } = body;

    if (!name || !category || !basePrice || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "Data produk dan matriks varian wajib diisi lengkap." },
        { status: 400 }
      );
    }

    const images = imageUrl && String(imageUrl).trim()
      ? [String(imageUrl).trim()]
      : [
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop&q=80",
        ];

    const created = db.createProductForStore(session.storeId, {
      name: String(name).trim(),
      category: String(category).trim(),
      basePrice: Number(basePrice),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      images,
      isFeatured: Boolean(isFeatured),
      variants: variants.map((v: { size: string; color: string; stock: number }) => ({
        size: String(v.size || "L").trim(),
        color: String(v.color || "Black").trim(),
        stock: Number(v.stock) || 0,
      })),
    });

    if (!created) {
      return NextResponse.json(
        { error: "Tenant tidak ditemukan." },
        { status: 404 }
      );
    }

    // Also attempt Prisma MySQL insert with strict storeId relation
    try {
      await prisma.product.create({
        data: {
          id: created.id,
          storeId: session.storeId,
          name: created.name,
          slug: created.slug,
          category: created.category,
          basePrice: created.basePrice,
          discountPrice: created.discountPrice,
          images: created.images,
          isFeatured: created.isFeatured,
          variants: {
            create: created.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              stock: v.stock,
            })),
          },
        },
      });
    } catch {
      // Zero-config snapshot already saved
    }

    return NextResponse.json({
      success: true,
      storeId: session.storeId,
      product: created,
    });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan produk baru." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = getCurrentSession();
    if (session.role !== "STORE_ADMIN" || !session.storeId) {
      return NextResponse.json(
        { error: "Unauthorized: Hanya STORE_ADMIN yang diizinkan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");
    if (!productId) {
      return NextResponse.json(
        { error: "ID Produk diperlukan." },
        { status: 400 }
      );
    }

    try {
      await prisma.product.deleteMany({
        where: {
          id: productId,
          storeId: session.storeId,
        },
      });
    } catch {
      // Zero-config snapshot fallback
    }

    const deleted = db.deleteProductForStore(session.storeId, productId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan atau bukan milik toko Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}

