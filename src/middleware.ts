import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, getDemoAccountByKey } from "@/lib/auth-shared";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals, static assets, and auth role switcher API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionKey = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const account = getDemoAccountByKey(sessionKey);

  // 1. STRICT GUARD FOR STORE_ADMIN:
  // STORE_ADMIN HANYA bisa mengakses rute /seller/* (dan API seller) dan terisolasi berdasarkan storeId miliknya sendiri
  if (account.role === "STORE_ADMIN") {
    const isSellerRoute =
      pathname === "/seller" ||
      pathname.startsWith("/seller/") ||
      pathname.startsWith("/api/seller");

    if (!isSellerRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/seller/dashboard";
      url.searchParams.set("guard", "store_admin_only_seller");
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    // Attach isolated tenant storeId header for downstream Seller Server Components & APIs
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-store-id", account.storeId || "");
    requestHeaders.set("x-user-role", account.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. GUARD FOR BUYER (USER):
  // Buyer tidak boleh mengakses /seller/*, /superadmin/*, atau /admin/*
  if (account.role === "USER") {
    if (
      pathname.startsWith("/seller") ||
      pathname.startsWith("/superadmin") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api/seller") ||
      pathname.startsWith("/api/superadmin") ||
      pathname.startsWith("/api/admin")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("guard", "unauthorized_buyer");
      return NextResponse.redirect(url);
    }
  }

  // 3. GUARD FOR SUPERADMIN:
  // Jika Superadmin mengakses /seller atau /admin, arahkan ke /superadmin/dashboard
  if (account.role === "SUPERADMIN") {
    if (pathname.startsWith("/seller") || pathname === "/admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/superadmin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

