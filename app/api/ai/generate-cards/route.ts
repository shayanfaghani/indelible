import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    getAIClient,
    AI_MODEL,
    buildGenerateCardsPrompt,
    checkUsage,
    incrementUsage,
    containsInjection,
} from "@/lib/ai/client";

const VALID_COUNTS = [5, 10, 15, 20];

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
        const { topic, count } = body;

        if (
            typeof topic !== "string" ||
            !topic.trim() ||
            topic.length > 100
        ) {
            return NextResponse.json(
                { error: "Invalid topic. Must be a non-empty string under 100 characters." },
                { status: 400 }
            );
        }

        if (!VALID_COUNTS.includes(count)) {
            return NextResponse.json(
                { error: "Count must be 5, 10, 15, or 20." },
                { status: 400 }
            );
        }

        if (containsInjection(topic)) {
            return NextResponse.json(
                { error: "Invalid topic. Please enter a vocabulary category (e.g. 'TOEFL words', 'medical terms')." },
                { status: 400 }
            );
        }

        const { allowed, currentCount } = await checkUsage(supabase, user.id);

        if (!allowed) {
            return NextResponse.json(
                { error: "Daily limit reached. You've used all 3 AI requests for today." },
                { status: 429 }
            );
        }

        const { system, user: userMsg } = buildGenerateCardsPrompt(topic.trim(), count);

        let completion;
        try {
            completion = await getAIClient().chat.completions.create({
                model: AI_MODEL(),
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: userMsg },
                ],
                temperature: 0.7,
            });
        } catch (aiError: any) {
            if (aiError?.status === 429) {
                return NextResponse.json(
                    { error: "The AI model is currently rate-limited. Try again in a minute, or switch to a different model." },
                    { status: 503 }
                );
            }
            throw aiError;
        }

        const rawText = completion.choices[0]?.message?.content ?? "";

        let parsed: any;
        try {
            const clean = rawText.trim().replace(/^```json\n?|\n?```$/g, "");
            parsed = JSON.parse(clean);
        } catch {
            return NextResponse.json(
                { error: "AI returned an unexpected response. Please try again." },
                { status: 502 }
            );
        }

        if (parsed.error === "unsupported_request") {
            return NextResponse.json(
                { error: "Invalid topic. Please enter a vocabulary category (e.g. 'TOEFL words', 'medical terms')." },
                { status: 400 }
            );
        }

        if (!Array.isArray(parsed.cards) || parsed.cards.length === 0) {
            return NextResponse.json(
                { error: "AI returned an unexpected response. Please try again." },
                { status: 502 }
            );
        }

        const suggestions = parsed.cards
            .filter((c: any) => typeof c.front === "string" && typeof c.back === "string")
            .map((c: any) => ({
                front: String(c.front).slice(0, 500),
                back: String(c.back).slice(0, 1000),
            }));

        if (suggestions.length === 0) {
            return NextResponse.json(
                { error: "AI returned no valid cards. Please try again." },
                { status: 502 }
            );
        }

        const remaining = await incrementUsage(supabase, user.id, currentCount);

        return NextResponse.json({ suggestions, remainingRequests: remaining }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
