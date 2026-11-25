import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple JWT decode that works in Edge Runtime (no Node crypto needed)
// Verification happens in API routes; middleware only needs to read payload
const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
};

const getUserInMiddleware = async () => {
  try {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;
    if (!token) return null;

    const decoded = decodeJwt(token);
    if (!decoded?.id) return null;

    return { id: decoded.id, type: decoded.type, isAdmin: decoded.isAdmin, reg: decoded.reg };
  } catch {
    return null;
  }
};

export const middleware = async (request) => {
  const { pathname } = request.nextUrl;

  try {
    if (pathname.startsWith("/auth")) {
      const user = await getUserInMiddleware();

      if (user && !user.reg && pathname !== "/auth/verify-email" && pathname !== "/auth/forgot-password") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    if (pathname.startsWith("/dashboard")) {
      const user = await getUserInMiddleware();

      if (!user) {
        return NextResponse.redirect(new URL("/auth", request.url));
      }

      if (user.reg) {
        return NextResponse.redirect(new URL("/auth", request.url));
      }

      if (pathname.startsWith("/dashboard/user") && user.type && user.type !== "customer") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (
        pathname.startsWith("/dashboard/property-owners") &&
        user.type && user.type !== "property-owner"
      ) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (
        pathname.startsWith("/dashboard/bus-owners") &&
        user.type && user.type !== "bus-owner"
      ) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (
        pathname.startsWith("/dashboard/food-owners") &&
        user.type && user.type !== "food-owner"
      ) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Prevent any caching of dashboard pages so a previous user's data isn't shown after re-login
      const res = NextResponse.next();
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
      return res;
    }

    if (pathname.startsWith("/iso")) {
      const user = await getUserInMiddleware();

      if (!user?.isAdmin) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
};

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*", "/iso/:path*"],
};
