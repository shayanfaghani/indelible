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

    const pathname = req.nextUrl.pathname;

    // 1. Handle root redirect
    if (pathname === "/") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    // 2. Protected routes logic
    const protectedRoutes = ["/dashboard", "/review", "/cards"];
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("redirect", pathname);

        // Create redirect response
        const redirectRes = NextResponse.redirect(redirectUrl);

        // CRITICAL: Copy cookies to the redirect response so the session/auth state isn't lost
        req.cookies.getAll().forEach((cookie) => {
            redirectRes.cookies.set(cookie.name, cookie.value);
        });

        return redirectRes;
    }

    // Redirect to dashboard if accessing auth pages with active session
    if ((pathname === "/login" || pathname === "/signup") && session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";

        const redirectRes = NextResponse.redirect(redirectUrl);

        // CRITICAL: Copy cookies
        req.cookies.getAll().forEach((cookie) => {
            redirectRes.cookies.set(cookie.name, cookie.value);
        });

        return redirectRes;
    }

    return res;
}

export const config = {
    // Robust matcher to exclude static assets, icons, and next internals
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icons (PWA icons)
         * - manifest.json (PWA manifest)
         * - sw.js (service worker)
         * - workbox-*.js (workbox files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)",
    ],
};
