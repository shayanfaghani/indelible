import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRemainingRequests, DAILY_LIMIT } from "@/lib/ai/client";

export async function GET() {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const remaining = await getRemainingRequests(supabase, user.id);

        return NextResponse.json({
            remainingRequests: remaining,
            usedToday: DAILY_LIMIT - remaining,
            dailyLimit: DAILY_LIMIT,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
