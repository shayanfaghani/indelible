"use client";

import { useState, useEffect } from "react";
import AIIcon from "@/components/icons/AIIcon";

const COUNT_OPTIONS = [5, 10, 15, 20] as const;
type CountOption = (typeof COUNT_OPTIONS)[number];

interface Suggestion {
    front: string;
    back: string;
}

type Step = "input" | "reviewing" | "success";

interface Props {
    onClose: () => void;
    onSuccess: (count: number) => void;
    initialTopic?: string;
    initialCount?: CountOption;
}

export default function AIGenerateModal({ onClose, onSuccess, initialTopic, initialCount }: Props) {
    const [step, setStep] = useState<Step>("input");

    // input step
    const [topic, setTopic] = useState(initialTopic ?? "");
    const [count, setCount] = useState<CountOption>(initialCount ?? 10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
    const [dailyLimit, setDailyLimit] = useState<number | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    // reviewing step
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    // success step
    const [successCount, setSuccessCount] = useState(0);

    useEffect(() => {
        fetch("/api/ai/usage")
            .then((r) => r.json())
            .then((d) => {
                setRemainingRequests(d.remainingRequests ?? null);
                setDailyLimit(d.dailyLimit ?? null);
            })
            .catch(() => {});
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setGenerateError(null);

        try {
            const res = await fetch("/api/ai/generate-cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: topic.trim(), count }),
            });
            const data = await res.json();

            if (!res.ok) {
                setGenerateError(data.error ?? "Something went wrong. Please try again.");
                return;
            }

            const cards: Suggestion[] = data.suggestions ?? [];
            setSuggestions(cards);
            setSelected(new Set(cards.map((_, i) => i)));
            setRemainingRequests(data.remainingRequests);
            setStep("reviewing");
        } catch {
            setGenerateError("Failed to connect. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleCard = (i: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(
            selected.size === suggestions.length
                ? new Set()
                : new Set(suggestions.map((_, i) => i))
        );
    };

    const handleAddSelected = async () => {
        if (selected.size === 0) return;

        setIsAdding(true);
        setAddError(null);

        const cards = Array.from(selected).map((i) => suggestions[i]);

        try {
            const res = await fetch("/api/cards/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cards }),
            });
            const data = await res.json();

            if (!res.ok) {
                setAddError(data.error ?? "Failed to add cards. Please try again.");
                return;
            }

            setSuccessCount(data.cards.length);
            onSuccess(data.cards.length);
            setStep("success");
        } catch {
            setAddError("Failed to connect. Please try again.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl">

                {/* ── Step 1: Input ── */}
                {step === "input" && (
                    <>
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Generate Cards with AI</h2>
                                {remainingRequests !== null && dailyLimit !== null && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {dailyLimit >= 100000
                                            ? "Unlimited requests"
                                            : `${remainingRequests} of ${dailyLimit} requests remaining today`}
                                    </p>
                                )}
                            </div>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. TOEFL vocabulary, medical terms, business English..."
                                    maxLength={100}
                                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-700 focus:border-gold focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Number of Cards</label>
                                <div className="flex gap-2">
                                    {COUNT_OPTIONS.map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setCount(n)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                count === n
                                                    ? "bg-gold text-obsidian"
                                                    : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {generateError && (
                                <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{generateError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={!topic.trim() || isGenerating || remainingRequests === 0}
                                className="w-full py-2.5 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-obsidian" />
                                        Generating...
                                    </>
                                ) : remainingRequests === 0 ? (
                                    "Daily limit reached"
                                ) : (
                                    <>
                                        <AIIcon size={16} />
                                        Generate {count} Cards
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}

                {/* ── Step 2: Review & Select ── */}
                {step === "reviewing" && (
                    <>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Review Cards</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selected.size} of {suggestions.length} selected
                                </p>
                            </div>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>

                        <button
                            onClick={toggleAll}
                            className="text-xs text-gold hover:text-yellow-400 transition-colors mb-3"
                        >
                            {selected.size === suggestions.length ? "Deselect all" : "Select all"}
                        </button>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-5">
                            {suggestions.map((card, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => toggleCard(i)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selected.has(i)
                                            ? "border-gold/40 bg-gold/5"
                                            : "border-gray-700 bg-gray-800/50 opacity-50"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-colors ${
                                            selected.has(i) ? "border-gold bg-gold" : "border-gray-600"
                                        }`}>
                                            {selected.has(i) && (
                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-obsidian"><polyline points="20 6 9 17 4 12"/></svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium">{card.front}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{card.back}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {addError && (
                            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mb-4">{addError}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleAddSelected}
                                disabled={selected.size === 0 || isAdding}
                                className="flex-1 py-2.5 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isAdding ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-obsidian" />
                                        Adding...
                                    </>
                                ) : (
                                    `Add ${selected.size} Card${selected.size !== 1 ? "s" : ""}`
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step 3: Success ── */}
                {step === "success" && (
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h2 className="text-white font-semibold text-lg mb-2">Cards Added!</h2>
                        <p className="text-gray-400 text-sm mb-1">
                            {successCount} new card{successCount !== 1 ? "s" : ""} have been added to your deck.
                        </p>
                        {remainingRequests !== null && dailyLimit !== null && dailyLimit < 100000 && (
                            <p className="text-gray-500 text-xs mb-6">
                                {remainingRequests} AI request{remainingRequests !== 1 ? "s" : ""} remaining today.
                            </p>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors mt-4"
                        >
                            Done
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
