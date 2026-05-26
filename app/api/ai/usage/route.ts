import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkUsage } from "@/lib/ai/client";

export async function GET() {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentCount, userLimit } = await checkUsage(supabase, user.id);

        return NextResponse.json({
            remainingRequests: Math.max(0, userLimit - currentCount),
            usedToday: currentCount,
            dailyLimit: userLimit,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
