"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface Card {
    id: string;
    front: string;
    back: string;
    box_level: number;
    is_vaulted: boolean;
    next_review_at: string;
}

export default function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const res = await fetch("/api/cards");
            const data = await res.json();
            setCards(data.cards || []);
        } catch (error) {
            console.error("Failed to fetch cards:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (cardId: string) => {
        if (!confirm("Are you sure you want to delete this card?")) return;

        try {
            await fetch(`/api/cards?id=${cardId}`, { method: "DELETE" });
            setCards(cards.filter((c) => c.id !== cardId));
        } catch (error) {
            console.error("Failed to delete card:", error);
        }
    };

    const getBoxLabel = (level: number) => {
        const labels = ["Daily", "2 Days", "4 Days", "Weekly", "Bi-weekly", "6 Months", "Yearly", "2 Years"];
        return labels[level - 1] || "Unknown";
    };

    if (isLoading) {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-obsidian flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="text-gray-400 hover:text-white transition-colors mr-4"
                            >
                                ← Back
                            </button>
                            <h1 className="text-2xl font-bold text-white">All Cards</h1>
                        </div>
                        <button
                            onClick={() => router.push("/cards/new")}
                            className="px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            + New Card
                        </button>
                    </div>

                    {cards.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 mb-4">No cards yet</p>
                            <button
                                onClick={() => router.push("/cards/new")}
                                className="px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                                Create Your First Card
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`bg-gray-900 rounded-lg p-6 border ${card.is_vaulted ? "border-emerald/50" : "border-gray-800"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <p className="text-white font-medium mb-2">{card.front}</p>
                                            <p className="text-gray-400 text-sm">{card.back}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(card.id)}
                                            className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span
                                            className={`px-3 py-1 rounded-full ${card.is_vaulted
                                                    ? "bg-emerald/20 text-emerald"
                                                    : "bg-gray-800 text-gray-400"
                                                }`}
                                        >
                                            {card.is_vaulted ? "🏛️ Vaulted" : `Box ${card.box_level}`}
                                        </span>
                                        <span className="text-gray-500">{getBoxLabel(card.box_level)}</span>
                                        <span className="text-gray-500">
                                            Next: {new Date(card.next_review_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
