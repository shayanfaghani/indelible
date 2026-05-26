import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    getAIClient,
    AI_MODEL,
    buildChatPrompt,
    checkUsage,
    incrementUsage,
    containsInjection,
} from "@/lib/ai/client";
import { findDuplicates } from "@/lib/ai/find-duplicates";

const VALID_ACTIONS = new Set([
    "add_single_card",
    "open_generator",
    "delete_card",
    "delete_duplicates",
    "delete_all",
]);

function extractSearchTerm(message: string): string | null {
    const quoted = message.match(/["']([^"']{2,50})["']/);
    if (quoted) return quoted[1];
    const afterKeyword = message.match(
        /(?:delete|remove|erase|find|look\s+up|word|card)\s+(?:the\s+)?(?:word\s+|card\s+)?(?:for\s+)?([a-zA-ZÀ-ɏ]{3,40})/i
    );
    return afterKeyword?.[1] ?? null;
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

        const body = await request.json();
        const { message } = body;

        if (typeof message !== "string" || !message.trim() || message.length > 200) {
            return NextResponse.json(
                { error: "Message must be a non-empty string under 200 characters." },
                { status: 400 }
            );
        }

        if (containsInjection(message)) {
            return NextResponse.json(
                { error: "I can only help with card management tasks like adding words, removing duplicates, or checking your stats." },
                { status: 400 }
            );
        }

        const { allowed, currentCount, userLimit } = await checkUsage(supabase, user.id);
        if (!allowed) {
            return NextResponse.json(
                { error: "Daily limit reached. You've used all 3 AI requests for today." },
                { status: 429 }
            );
        }

        // Fetch compact card list
        const now = new Date().toISOString();
        const { data: cards } = await (supabase as any)
            .from("cards")
            .select("id, front, box_level, is_vaulted, next_review_at")
            .eq("user_id", user.id);

        const allCards: { id: string; front: string; box_level: number; is_vaulted: boolean; next_review_at: string }[] =
            cards ?? [];

        const validCardIds = new Set(allCards.map((c) => c.id));
        const { groups: dupGroups, allDeleteIds } = findDuplicates(allCards);

        const totalCards = allCards.length;
        const vaultedCount = allCards.filter((c) => c.is_vaulted).length;
        const dueCount = allCards.filter((c) => !c.is_vaulted && c.next_review_at <= now).length;

        // Build context
        let context = `Total cards: ${totalCards}\nDue for review today: ${dueCount}\nVaulted (mastered): ${vaultedCount}\n`;

        if (dupGroups.length > 0) {
            context += `\nDuplicate cards: ${dupGroups.length} group${dupGroups.length !== 1 ? "s" : ""} found (${allDeleteIds.length} card${allDeleteIds.length !== 1 ? "s" : ""} can be removed):\n`;
            for (const g of dupGroups) {
                context += `- "${g.front}" — keep ID ${g.keepId} (box ${allCards.find((c) => c.id === g.keepId)?.box_level ?? "?"}), delete: ${g.deleteIds.join(", ")}\n`;
            }
        } else {
            context += `\nNo duplicate cards found.\n`;
        }

        // Search for specific card if message references one
        const searchTerm = extractSearchTerm(message);
        if (searchTerm) {
            const matches = allCards
                .filter((c) => c.front.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice(0, 5);
            if (matches.length > 0) {
                context += `\nCards matching "${searchTerm}":\n`;
                for (const m of matches) {
                    context += `- ID: ${m.id}  front: "${m.front}"  box: ${m.box_level}\n`;
                }
            }
        }

        const { system } = buildChatPrompt(context);

        let completion;
        try {
            completion = await getAIClient().chat.completions.create({
                model: AI_MODEL(),
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: message.trim() },
                ],
                temperature: 0.2,
            });
        } catch (aiError: any) {
            if (aiError?.status === 429) {
                return NextResponse.json(
                    { error: "The AI model is currently rate-limited. Try again in a minute." },
                    { status: 503 }
                );
            }
            throw aiError;
        }

        const rawText = completion.choices[0]?.message?.content ?? "";
        const clean = rawText.trim().replace(/^```json\n?|\n?```$/g, "");

        let parsed: any;
        try {
            parsed = JSON.parse(clean);
        } catch {
            return NextResponse.json(
                { error: "AI returned an unexpected response. Please try again." },
                { status: 502 }
            );
        }

        // Validate response shape
        if (
            typeof parsed.reply !== "string" ||
            (parsed.action !== null && !VALID_ACTIONS.has(parsed.action)) ||
            typeof parsed.requiresConfirmation !== "boolean"
        ) {
            return NextResponse.json(
                { error: "AI returned an unexpected response. Please try again." },
                { status: 502 }
            );
        }

        // Security: strip any IDs that don't belong to this user
        if (Array.isArray(parsed.params?.ids)) {
            parsed.params.ids = parsed.params.ids.filter((id: any) =>
                typeof id === "string" && validCardIds.has(id)
            );
        }

        // Always require confirmation for add_single_card regardless of what the LLM returned
        if (parsed.action === "add_single_card") {
            parsed.requiresConfirmation = true;
            if (!parsed.confirmLabel) parsed.confirmLabel = "Add Card";
        }

        await incrementUsage(supabase, user.id, currentCount, userLimit);

        return NextResponse.json({
            reply: parsed.reply,
            action: parsed.action ?? null,
            params: parsed.params ?? {},
            requiresConfirmation: parsed.requiresConfirmation ?? false,
            confirmLabel: typeof parsed.confirmLabel === "string" ? parsed.confirmLabel : undefined,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
