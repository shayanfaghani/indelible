import { NextResponse } from "next/status";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
