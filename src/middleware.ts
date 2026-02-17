import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const isMock = process.env.MOCK_DATA === "true";

export default isMock
    ? function middleware() {
        return NextResponse.next();
    }
    : auth((req) => {
        const { pathname } = req.nextUrl;

        // Public routes
        if (pathname === "/login" || pathname.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        // Redirect unauthenticated users
        if (!req.auth && pathname.startsWith("/dashboard")) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Redirect root to dashboard
        if (pathname === "/") {
            if (req.auth) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            return NextResponse.redirect(new URL("/login", req.url));
        }

        return NextResponse.next();
    });

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
