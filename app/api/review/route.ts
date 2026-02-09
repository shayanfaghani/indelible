import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    handleSuccess,
    handleFailure,
    handleHard,
    calculateNextReview,
    isNewlyVaulted,
    calculateXP,
} from "@/lib/leitner/engine";
import { applySmoothingAlgorithm, getDueCards } from "@/lib/leitner/smoothing";

// GET: Fetch due cards with smoothing applied
export async function GET() {
    try {
        const supabase = createServerClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all user's cards
        const { data: allCards, error: cardsError } = (await supabase
            .from("cards")
            .select("*")
            .eq("user_id", session.user.id)) as any;

        if (cardsError) throw cardsError;

        // Filter due cards
        const dueCards = getDueCards(allCards || []);

        // Apply smoothing algorithm
        const { cardsToShow, cardsToPush } = applySmoothingAlgorithm(dueCards);

        // Update pushed cards in database
        if (cardsToPush.length > 0) {
            const updates = cardsToPush.map((card) => {
                const newReviewTime = new Date(card.next_review_at);
                newReviewTime.setHours(newReviewTime.getHours() + 24);
                return {
                    id: card.id,
                    next_review_at: newReviewTime.toISOString(),
                };
            });

            for (const update of updates) {
                await supabase
                    .from("cards")
                    .update({ next_review_at: update.next_review_at } as any)
                    .eq("id", update.id);
            }
        }

        return NextResponse.json({ cards: cardsToShow });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Submit review result
export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cardId, result } = await request.json();

        if (!cardId || !result) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get current card
        const { data: card, error: cardError } = (await supabase
            .from("cards")
            .select("*")
            .eq("id", cardId)
            .eq("user_id", session.user.id)
            .single()) as any;

        if (cardError || !card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        // Calculate new box level
        let newBoxLevel = card.box_level;
        if (result === "success") {
            newBoxLevel = handleSuccess(card.box_level);
        } else if (result === "failure") {
            newBoxLevel = handleFailure(card.box_level);
        } else if (result === "hard") {
            newBoxLevel = handleHard(card.box_level);
        }

        // Check if card is newly vaulted
        const vaulted = isNewlyVaulted(card.box_level, newBoxLevel);

        // Calculate next review time
        const nextReview = calculateNextReview(newBoxLevel);

        // Calculate XP gain
        const xpGain = calculateXP(result, vaulted);

        // Update card
        await supabase
            .from("cards")
            .update({
                box_level: newBoxLevel,
                last_reviewed: new Date().toISOString(),
                next_review_at: nextReview.toISOString(),
                is_vaulted: newBoxLevel >= 6,
            } as any)
            .eq("id", cardId);

        // Update user profile (XP and Knowledge Net Value)
        const { data: profile } = (await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()) as any;

        if (profile) {
            await supabase
                .from("profiles")
                .update({
                    xp: profile.xp + xpGain,
                    knowledge_net_value: profile.knowledge_net_value + xpGain,
                } as any)
                .eq("user_id", session.user.id);
        }

        return NextResponse.json({
            success: true,
            vaulted,
            newBoxLevel,
            xpGain,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
