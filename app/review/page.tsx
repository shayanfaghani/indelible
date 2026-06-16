"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardFlip from "@/components/cards/CardFlip";
import ReviewButtons from "@/components/cards/ReviewButtons";
import VaultAnimation from "@/components/vault/VaultAnimation";
import AuthGuard from "@/components/auth/AuthGuard";
import BottomNav from "@/components/nav/BottomNav";

interface Card {
    id: string;
    front: string;
    back: string;
    box_level: number;
}

export default function ReviewPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showVault, setShowVault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchDueCards();
    }, []);

    const fetchDueCards = async () => {
        try {
            const res = await fetch("/api/review");
            const data = await res.json();
            setCards(data.cards || []);
        } catch (error) {
            console.error("Failed to fetch cards:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async (result: "success" | "hard" | "failure") => {
        if (isSubmitting || !cards[currentIndex]) return;

        setIsSubmitting(true);
        const card = cards[currentIndex];

        try {
            const res = await fetch("/api/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cardId: card.id,
                    result,
                }),
            });

            const data = await res.json();

            // Show vault animation if card was vaulted
            if (data.vaulted) {
                setShowVault(true);
            } else {
                moveToNextCard();
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const moveToNextCard = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleVaultComplete = () => {
        setShowVault(false);
        moveToNextCard();
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

    if (cards.length === 0) {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
                    <div className="text-center">
                        <p className="text-6xl mb-4">🎉</p>
                        <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
                        <p className="text-gray-400 mb-6">No cards due for review</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </AuthGuard>
        );
    }

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8 pb-28 md:pb-28">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back
                        </button>
                        <div className="text-gray-400">
                            {currentIndex + 1} / {cards.length}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
                        <div
                            className="bg-gold h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Card */}
                    <div className="mb-8">
                        <CardFlip
                            front={currentCard.front}
                            back={currentCard.back}
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(!isFlipped)}
                        />
                    </div>

                    {/* Review Buttons */}
                    {isFlipped && (
                        <ReviewButtons
                            onForgot={() => handleReview("failure")}
                            onHard={() => handleReview("hard")}
                            onGotIt={() => handleReview("success")}
                            disabled={isSubmitting}
                        />
                    )}

                    {!isFlipped && (
                        <p className="text-center text-gray-500 text-sm">
                            Flip the card to see the answer before reviewing
                        </p>
                    )}
                </div>

                {/* Vault Animation */}
                <VaultAnimation isVisible={showVault} onComplete={handleVaultComplete} />
            </div>

            <BottomNav />
        </AuthGuard>
    );
}
