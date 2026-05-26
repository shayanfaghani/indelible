"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AIGenerateModal from "@/components/cards/AIGenerateModal";
import AIIcon from "@/components/icons/AIIcon";

type Phase = "idle" | "loading" | "responded" | "executing" | "done" | "error";

interface ChatResponse {
    reply: string;
    action: "add_single_card" | "open_generator" | "delete_card" | "delete_duplicates" | "delete_all" | null;
    params: {
        front?: string;
        back?: string;
        topic?: string;
        count?: number;
        ids?: string[];
    };
    requiresConfirmation: boolean;
    confirmLabel?: string;
}

const HINTS = ["Add 10 TOEFL words", "Remove duplicates", "How many cards?"];

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [sentMessage, setSentMessage] = useState("");
    const [phase, setPhase] = useState<Phase>("idle");
    const [response, setResponse] = useState<ChatResponse | null>(null);
    const [resultMessage, setResultMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [generatorPreFill, setGeneratorPreFill] = useState<{ topic: string; count: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && phase === "idle") {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const reset = () => {
        setPhase("idle");
        setResponse(null);
        setResultMessage("");
        setErrorMessage("");
        setMessage("");
        setSentMessage("");
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || phase === "loading" || phase === "executing") return;

        setSentMessage(trimmed);
        setPhase("loading");
        setResponse(null);
        setResultMessage("");
        setErrorMessage("");

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed }),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error ?? "Something went wrong. Please try again.");
                setPhase("error");
                return;
            }

            setResponse(data as ChatResponse);
            setPhase("responded");
        } catch {
            setErrorMessage("Failed to connect. Please try again.");
            setPhase("error");
        }
    };

    const handleOpenGenerator = () => {
        if (!response) return;
        const COUNT_OPTIONS = [5, 10, 15, 20] as const;
        type CountOption = (typeof COUNT_OPTIONS)[number];
        const rawCount = response.params.count ?? 10;
        const safeCount = (COUNT_OPTIONS as readonly number[]).includes(rawCount)
            ? (rawCount as CountOption)
            : 10;
        setGeneratorPreFill({ topic: response.params.topic ?? "", count: safeCount });
        setGeneratorOpen(true);
        setIsOpen(false);
        reset();
    };

    const handleConfirm = async () => {
        if (!response) return;
        setPhase("executing");

        try {
            if (response.action === "add_single_card") {
                const res = await fetch("/api/cards", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ front: response.params.front, back: response.params.back }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Failed to add card.");
                router.refresh();
                window.dispatchEvent(new CustomEvent("cards-updated"));
                setResultMessage(`Done. "${response.params.front}" added to your deck.`);
                setPhase("done");
                return;
            }

            let deleted = 0;

            if (response.action === "delete_card" || response.action === "delete_duplicates") {
                const ids = response.params.ids ?? [];
                if (ids.length === 0) throw new Error("No card IDs to delete.");
                const res = await fetch("/api/cards/bulk", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Delete failed.");
                deleted = data.deleted ?? ids.length;
            } else if (response.action === "delete_all") {
                const res = await fetch("/api/cards/bulk", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ all: true }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Delete failed.");
                deleted = data.deleted ?? 0;
            }

            router.refresh();
            window.dispatchEvent(new CustomEvent("cards-updated"));
            setResultMessage(
                response.action === "delete_all"
                    ? `Done. All ${deleted} cards deleted.`
                    : `Done. ${deleted} card${deleted !== 1 ? "s" : ""} deleted.`
            );
            setPhase("done");
        } catch (err: any) {
            setErrorMessage(err.message ?? "Action failed. Please try again.");
            setPhase("error");
        }
    };

    const isDestructive =
        response?.action === "delete_card" ||
        response?.action === "delete_duplicates" ||
        response?.action === "delete_all";

    const needsConfirm =
        response?.requiresConfirmation &&
        (response.action === "add_single_card" || isDestructive);

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Open AI assistant"
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold text-obsidian shadow-lg flex items-center justify-center transition-all hover:bg-yellow-500 hover:scale-105 active:scale-95 ${isOpen ? "scale-95" : ""}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                    <AIIcon size={22} />
                )}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    style={{ maxHeight: "min(480px, calc(100vh - 120px))" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <AIIcon size={15} className="text-gold" />
                            <span className="text-white text-sm font-semibold">AI Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {/* Idle: hints */}
                        {phase === "idle" && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <p className="text-gray-500 text-sm text-center">
                                    Ask me to add words, remove duplicates,<br />or check your card stats.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {HINTS.map((hint) => (
                                        <button
                                            key={hint}
                                            onClick={() => setMessage(hint)}
                                            className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-full hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
                                        >
                                            {hint}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User message bubble (shown during loading and responded) */}
                        {(phase === "loading" || phase === "responded" || phase === "executing") && sentMessage && (
                            <div className="flex justify-end">
                                <p className="bg-gray-800 text-white text-sm px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%] break-words">
                                    {sentMessage}
                                </p>
                            </div>
                        )}

                        {/* Loading */}
                        {phase === "loading" && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gold shrink-0" />
                                Thinking...
                            </div>
                        )}

                        {/* Executing */}
                        {phase === "executing" && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gold shrink-0" />
                                Working on it...
                            </div>
                        )}

                        {/* Response */}
                        {phase === "responded" && response && (
                            <>
                                {/* AI reply bubble */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-800/60 border border-gray-700 text-gray-200 text-sm px-3 py-2 rounded-xl rounded-tl-sm max-w-[85%] break-words">
                                        {response.reply}
                                    </div>
                                </div>

                                {/* Card preview for add_single_card */}
                                {response.action === "add_single_card" && response.params.front && (
                                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
                                        <p className="text-white font-medium">{response.params.front}</p>
                                        <p className="text-gray-400 text-xs mt-1">{response.params.back}</p>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2 justify-end flex-wrap pt-1">
                                    {response.action === "open_generator" && (
                                        <button
                                            onClick={handleOpenGenerator}
                                            className="px-4 py-2 bg-gold text-obsidian text-sm font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-1.5"
                                        >
                                            Open Generator
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                        </button>
                                    )}

                                    {needsConfirm && (
                                        <>
                                            <button
                                                onClick={reset}
                                                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirm}
                                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-white ${
                                                    isDestructive
                                                        ? "bg-red-500/80 hover:bg-red-500"
                                                        : "bg-gold hover:bg-yellow-500 text-obsidian"
                                                }`}
                                            >
                                                {response.confirmLabel ?? "Confirm"}
                                            </button>
                                        </>
                                    )}

                                    {!response.action && (
                                        <button
                                            onClick={reset}
                                            className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                                        >
                                            Ask another
                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Done */}
                        {phase === "done" && (
                            <>
                                <div className="flex justify-start">
                                    <div className="bg-gray-800/60 border border-gray-700 text-gray-200 text-sm px-3 py-2 rounded-xl rounded-tl-sm flex items-center gap-2 max-w-[85%]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                                        {resultMessage}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={reset}
                                        className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                                    >
                                        Ask another
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Error */}
                        {phase === "error" && (
                            <>
                                <div className="flex justify-start">
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-xl rounded-tl-sm max-w-[85%] break-words">
                                        {errorMessage}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={reset}
                                        className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                                    >
                                        Try again
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Input footer */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2 px-3 py-3 border-t border-gray-800 shrink-0"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask me something..."
                            maxLength={200}
                            disabled={phase === "loading" || phase === "executing"}
                            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gold focus:outline-none disabled:opacity-50 placeholder-gray-600"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || phase === "loading" || phase === "executing"}
                            className="w-9 h-9 flex items-center justify-center bg-gold text-obsidian rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-40 shrink-0"
                            aria-label="Send"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* AI Generate Modal (pre-filled from chat) */}
            {generatorOpen && generatorPreFill && (
                <AIGenerateModal
                    initialTopic={generatorPreFill.topic}
                    initialCount={generatorPreFill.count as any}
                    onClose={() => {
                        setGeneratorOpen(false);
                        setGeneratorPreFill(null);
                    }}
                    onSuccess={() => {
                        router.refresh();
                        setGeneratorOpen(false);
                        setGeneratorPreFill(null);
                    }}
                />
            )}
        </>
    );
}
