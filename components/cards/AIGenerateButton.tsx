"use client";

import { useState } from "react";
import AIGenerateModal from "./AIGenerateModal";

export default function AIGenerateButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center gap-3 w-full py-3 md:py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Generate with AI
            </button>
            {isOpen && (
                <AIGenerateModal onClose={() => setIsOpen(false)} onSuccess={() => {}} />
            )}
        </>
    );
}
