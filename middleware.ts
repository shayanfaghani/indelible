import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Missing Supabase environment variables in Middleware");
            return NextResponse.next();
        }

        let res = NextResponse.next({
            request: {
                headers: req.headers,
            },
        });

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
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
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/dashboard";
            return NextResponse.redirect(redirectUrl);
        }

        // 2. Protected routes logic
        const protectedRoutes = ["/dashboard", "/review", "/cards"];
        const isProtectedRoute = protectedRoutes.some((route) =>
            pathname.startsWith(route)
        );

        if (isProtectedRoute && !session) {
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/login";
            redirectUrl.searchParams.set("redirect", pathname);
            const redirectRes = NextResponse.redirect(redirectUrl);

            // Re-bind cookies to the new response if any were set by supabase client
            // (e.g. if getSession updated the token)
            res.cookies.getAll().forEach(cookie => {
                redirectRes.cookies.set(cookie.name, cookie.value);
            });

            return redirectRes;
        }

        if ((pathname === "/login" || pathname === "/signup") && session) {
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/dashboard";
            const redirectRes = NextResponse.redirect(redirectUrl);

            res.cookies.getAll().forEach(cookie => {
                redirectRes.cookies.set(cookie.name, cookie.value);
            });

            return redirectRes;
        }

        return res;
    } catch (error) {
        console.error("Middleware error:", error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)",
    ],
};
