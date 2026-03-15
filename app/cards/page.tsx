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

interface EditState {
    front: string;
    back: string;
}

export default function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editState, setEditState] = useState<EditState>({ front: "", back: "" });
    const [pendingSave, setPendingSave] = useState<{ cardId: string; front: string; back: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
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

    const startEdit = (card: Card) => {
        setEditingId(card.id);
        setEditState({ front: card.front, back: card.back });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditState({ front: "", back: "" });
    };

    const handleSaveClick = (cardId: string) => {
        setPendingSave({ cardId, front: editState.front, back: editState.back });
    };

    const commitSave = async (resetBox: boolean) => {
        if (!pendingSave) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/cards?id=${pendingSave.cardId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ front: pendingSave.front, back: pendingSave.back, reset_box: resetBox }),
            });
            const data = await res.json();
            if (data.card) {
                setCards(cards.map((c) => (c.id === pendingSave.cardId ? data.card : c)));
            }
        } catch (error) {
            console.error("Failed to update card:", error);
        } finally {
            setIsSaving(false);
            setPendingSave(null);
            setEditingId(null);
            setEditState({ front: "", back: "" });
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
                            className="flex items-center gap-2 px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            New Card
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
                                    className={`bg-gray-900 rounded-lg p-6 border ${card.is_vaulted ? "border-emerald/50" : "border-gray-800"}`}
                                >
                                    {editingId === card.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Front</label>
                                                <textarea
                                                    value={editState.front}
                                                    onChange={(e) => setEditState((s) => ({ ...s, front: e.target.value }))}
                                                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-gold focus:outline-none resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Back</label>
                                                <textarea
                                                    value={editState.back}
                                                    onChange={(e) => setEditState((s) => ({ ...s, back: e.target.value }))}
                                                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-gold focus:outline-none resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleSaveClick(card.id)}
                                                    disabled={!editState.front.trim() || !editState.back.trim()}
                                                    className="px-4 py-1.5 bg-gold text-obsidian text-sm font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-40"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium mb-2">{card.front}</p>
                                                    <p className="text-gray-400 text-sm">{card.back}</p>
                                                </div>
                                                <div className="flex items-center gap-3 ml-4">
                                                    <button
                                                        onClick={() => startEdit(card)}
                                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(card.id)}
                                                        className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span
                                                    className={`px-3 py-1 rounded-full ${card.is_vaulted
                                                        ? "bg-emerald/20 text-emerald"
                                                        : "bg-gray-800 text-gray-400"
                                                        }`}
                                                >
                                                    {card.is_vaulted ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                                                            Vaulted
                                                        </span>
                                                    ) : `Box ${card.box_level}`}
                                                </span>
                                                <span className="text-gray-500">{getBoxLabel(card.box_level)}</span>
                                                <span className="text-gray-500">
                                                    Next: {new Date(card.next_review_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Box reset confirmation modal */}
            {pendingSave && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h2 className="text-white font-semibold text-lg mb-2">Reset to Box 1?</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Since you edited this card, would you like to move it back to Box 1 so it gets reviewed again from the start?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => commitSave(true)}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-40"
                            >
                                Yes, reset
                            </button>
                            <button
                                onClick={() => commitSave(false)}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                            >
                                No, keep box
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthGuard>
    );
}
