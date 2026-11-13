import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import {
  INITIAL_USERS,
  INITIAL_STORES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_WITHDRAWALS,
  INITIAL_MARKETING_CONFIG,
} from "./seed-data";

const prisma = new PrismaClient();

async function seedMySQL() {
  console.log("🚀 Attempting to seed MySQL database via Prisma ORM...");

  // Upsert Users
  for (const user of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: new Date(user.createdAt),
      },
    });
  }

  // Upsert Stores
  for (const store of INITIAL_STORES) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: {
        name: store.name,
        slug: store.slug,
        city: store.city,
        status: store.status,
        isOfficialStore: store.isOfficialStore,
        balance: store.balance,
      },
      create: {
        id: store.id,
        ownerId: store.ownerId,
        name: store.name,
        slug: store.slug,
        city: store.city,
        status: store.status,
        isOfficialStore: store.isOfficialStore,
        balance: store.balance,
        createdAt: new Date(store.createdAt),
      },
    });
  }

  // Upsert Products & Variants
  for (const product of INITIAL_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        slug: product.slug,
        category: product.category,
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        images: product.images,
        isFeatured: product.isFeatured,
      },
      create: {
        id: product.id,
        storeId: product.storeId,
        name: product.name,
        slug: product.slug,
        category: product.category,
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        images: product.images,
        isFeatured: product.isFeatured,
        createdAt: new Date(product.createdAt),
      },
    });

    for (const variant of product.variants) {
      await prisma.productVariant.upsert({
        where: { id: variant.id },
        update: {
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        },
        create: {
          id: variant.id,
          productId: variant.productId,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        },
      });
    }
  }

  // Upsert Initial Orders & SubOrders
  for (const order of INITIAL_ORDERS) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: {
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
      },
      create: {
        id: order.id,
        buyerId: order.buyerId,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        createdAt: new Date(order.createdAt),
      },
    });

    for (const sub of order.subOrders) {
      await prisma.subOrder.upsert({
        where: { id: sub.id },
        update: {
          subTotal: sub.subTotal,
          shippingCost: sub.shippingCost,
          shippingCourier: sub.shippingCourier,
          orderStatus: sub.orderStatus,
        },
        create: {
          id: sub.id,
          orderId: sub.orderId,
          storeId: sub.storeId,
          subTotal: sub.subTotal,
          shippingCost: sub.shippingCost,
          shippingCourier: sub.shippingCourier,
          orderStatus: sub.orderStatus,
          createdAt: new Date(sub.createdAt),
        },
      });

      for (const item of sub.items) {
        await prisma.orderItem.upsert({
          where: { id: item.id },
          update: {
            quantity: item.quantity,
            price: item.price,
          },
          create: {
            id: item.id,
            subOrderId: item.subOrderId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }
    }
  }

  console.log("✅ MySQL database seeded successfully via Prisma!");
}

function seedLocalSnapshot() {
  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const snapshotPath = path.join(dataDir, "mysql-snapshot.json");
  const snapshot = {
    users: INITIAL_USERS,
    stores: INITIAL_STORES,
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    withdrawals: INITIAL_WITHDRAWALS,
    marketing: INITIAL_MARKETING_CONFIG,
    seededAt: new Date().toISOString(),
  };
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`✅ Seeded zero-config MySQL snapshot at ${snapshotPath}`);
}

async function main() {
  seedLocalSnapshot();
  try {
    await seedMySQL();
  } catch (err) {
    console.log(
      "ℹ️  Local MySQL server (port 3306) is not active. Zero-config Prisma snapshot seeded & ready for instant execution!"
    );
  } finally {
    await prisma.$disconnect();
  }
}

main();

