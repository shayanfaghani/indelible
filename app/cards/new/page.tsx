"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

export default function NewCardPage() {
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ front, back }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create card");
            }

            // Use hard navigation to bypass Next.js Router Cache entirely
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-gray-400 hover:text-white transition-colors mr-4"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-white">Create New Card</h1>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="front" className="block text-sm font-medium text-gray-300 mb-2">
                                Question (Front)
                            </label>
                            <textarea
                                id="front"
                                value={front}
                                onChange={(e) => setFront(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                                placeholder="What do you want to remember?"
                            />
                        </div>

                        <div>
                            <label htmlFor="back" className="block text-sm font-medium text-gray-300 mb-2">
                                Answer (Back)
                            </label>
                            <textarea
                                id="back"
                                value={back}
                                onChange={(e) => setBack(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                                placeholder="The answer or explanation"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating..." : "Create Card"}
                        </button>
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
}
