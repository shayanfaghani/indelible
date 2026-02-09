import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    res.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected routes
    const protectedRoutes = ["/dashboard", "/review", "/cards"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        req.nextUrl.pathname.startsWith(route)
    );

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
        const redirectUrl = new URL("/login", req.url);
        redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Redirect to dashboard if accessing auth pages with active session
    if ((req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup") && session) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return res;
}

export const config = {
    matcher: ["/dashboard/:path*", "/review/:path*", "/cards/:path*", "/login", "/signup"],
};
