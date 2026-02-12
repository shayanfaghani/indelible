import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET: Fetch all cards for the user
export async function GET() {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: cards, error } = await (supabase as any)
            .from("cards")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ cards });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new card
export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { front, back } = await request.json();

        if (!front || !back) {
            return NextResponse.json(
                { error: "Front and back are required" },
                { status: 400 }
            );
        }

        // @ts-ignore
        const { data: card, error } = await (supabase as any)
            .from("cards")
            .insert({
                user_id: user.id,
                front,
                back,
                box_level: 1,
                next_review_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ card }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a card
export async function DELETE(request: Request) {
    try {
        const supabase = createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const cardId = searchParams.get("id");

        if (!cardId) {
            return NextResponse.json({ error: "Card ID required" }, { status: 400 });
        }

        const { error } = await (supabase as any)
            .from("cards")
            .delete()
            .eq("id", cardId)
            .eq("user_id", user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
