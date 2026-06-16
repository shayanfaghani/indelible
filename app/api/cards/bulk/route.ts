import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { ids, all } = body;

        let query = (supabase as any).from("cards").delete().eq("user_id", user.id);

        if (all === true) {
            // delete all — no extra filter needed beyond user_id
        } else if (Array.isArray(ids) && ids.length > 0) {
            // Validate: only allow IDs that actually belong to the user (RLS enforces this too)
            query = query.in("id", ids);
        } else {
            return NextResponse.json({ error: "Provide ids array or all:true." }, { status: 400 });
        }

        const { error, count } = await query.select();
        if (error) throw error;

        return NextResponse.json({ deleted: count ?? 0 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cards } = await request.json();

        if (!Array.isArray(cards) || cards.length === 0 || cards.length > 20) {
            return NextResponse.json({ error: "cards must be a non-empty array of up to 20 items." }, { status: 400 });
        }

        const now = new Date().toISOString();
        const rows = cards
            .filter((c: any) => typeof c.front === "string" && typeof c.back === "string")
            .map((c: any) => ({
                user_id: user.id,
                front: String(c.front).slice(0, 500),
                back: String(c.back).slice(0, 1000),
                box_level: 1,
                next_review_at: now,
            }));

        if (rows.length === 0) {
            return NextResponse.json({ error: "No valid cards provided." }, { status: 400 });
        }

        const { data: inserted, error: insertError } = await (supabase as any)
            .from("cards")
            .insert(rows)
            .select();

        if (insertError) throw insertError;

        return NextResponse.json({ cards: inserted }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
