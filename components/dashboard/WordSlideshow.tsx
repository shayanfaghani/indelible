"use client";

import { useState, useEffect, useCallback } from "react";

import type { Word } from "@/lib/data/essential-words";

interface WordSlideshowProps {
    words: Word[];
}

const INTERVAL_MS = 6000;

export default function WordSlideshow({ words }: WordSlideshowProps) {
    const [index, setIndex] = useState(() => Math.floor(Math.random() * words.length));
    const [visible, setVisible] = useState(true);

    const goTo = useCallback(
        (next: number) => {
            setVisible(false);
            setTimeout(() => {
                setIndex((next + words.length) % words.length);
                setVisible(true);
            }, 220);
        },
        [words.length]
    );

    useEffect(() => {
        const timer = setInterval(() => goTo(index + 1), INTERVAL_MS);
        return () => clearInterval(timer);
    }, [index, goTo]);

    const current = words[index];

    return (
        <div className="hidden md:flex md:flex-col h-full">
            <div
                className="flex flex-col flex-1 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
                {/* Wikipedia-style top bar */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 bg-gray-50">
                    <span className="text-xs text-gray-400 tracking-wide uppercase" style={{ fontFamily: "system-ui, sans-serif" }}>
                        Selected Words of the Month
                    </span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "system-ui, sans-serif" }}>
                        {index + 1} / {words.length}
                    </span>
                </div>

                {/* Card body */}
                <div
                    className="px-6 py-6 flex flex-col flex-1 justify-between transition-opacity duration-200"
                    style={{ opacity: visible ? 1 : 0 }}
                >
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.word}</h2>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200" style={{ fontFamily: "system-ui, sans-serif" }}>
                                definition
                            </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-[15px]">{current.meaning}</p>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100">
                        {/* Progress dots */}
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(words.length, 7) }).map((_, i) => {
                                const dotIndex = Math.floor((index / words.length) * 7);
                                return (
                                    <span
                                        key={i}
                                        className={`inline-block rounded-full transition-all duration-200 ${
                                            i === dotIndex
                                                ? "w-4 h-1.5 bg-gray-500"
                                                : "w-1.5 h-1.5 bg-gray-300"
                                        }`}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1" style={{ fontFamily: "system-ui, sans-serif" }}>
                            <button
                                onClick={() => goTo(index - 1)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label="Previous word"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                            </button>
                            <button
                                onClick={() => goTo(index + 1)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label="Next word"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
