import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
    getAIClient,
    AI_MODEL,
    buildDefineWordPrompt,
    checkUsage,
    incrementUsage,
    containsInjection,
} from "@/lib/ai/client";

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
        const { word } = body;

        if (typeof word !== "string" || !word.trim() || word.length > 50) {
            return NextResponse.json(
                { error: "Invalid word. Must be a non-empty string under 50 characters." },
                { status: 400 }
            );
        }

        if (containsInjection(word)) {
            return NextResponse.json(
                { error: "Invalid input." },
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

        const { system, user: userMsg } = buildDefineWordPrompt(word.trim());

        let completion;
        try {
            completion = await getAIClient().chat.completions.create({
                model: AI_MODEL(),
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: userMsg },
                ],
                temperature: 0.3,
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
                { error: "Invalid input." },
                { status: 400 }
            );
        }

        if (typeof parsed.definition !== "string" || typeof parsed.example !== "string") {
            return NextResponse.json(
                { error: "AI returned an unexpected response. Please try again." },
                { status: 502 }
            );
        }

        const remaining = await incrementUsage(supabase, user.id, currentCount, userLimit);

        return NextResponse.json({
            definition: parsed.definition,
            example: parsed.example,
            remainingRequests: remaining,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
