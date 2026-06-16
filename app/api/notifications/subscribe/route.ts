import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { endpoint, p256dh, auth } = await request.json();
        if (!endpoint || !p256dh || !auth)
            return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 });

        const { error } = await (supabase as any)
            .from("push_subscriptions")
            .upsert({ user_id: user.id, endpoint, p256dh, auth }, { onConflict: "endpoint" });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
