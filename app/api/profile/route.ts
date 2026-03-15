import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: { ...profile, email: user.email ?? null } });
}

export async function PUT(request: Request) {
    const supabase = createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, phone, avatar_url, notifications_enabled, notification_time, timezone } = body;

    const { data, error } = await (supabase as any)
        .from("profiles")
        .update({
            first_name: first_name ?? null,
            last_name: last_name ?? null,
            phone: phone ?? null,
            avatar_url: avatar_url ?? null,
            notifications_enabled: notifications_enabled ?? false,
            notification_time: notification_time ?? null,
            timezone: timezone ?? null,
        })
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
}
