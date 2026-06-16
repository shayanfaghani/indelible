"use client";

import { useState } from "react";
import AIGenerateModal from "./AIGenerateModal";
import AIIcon from "@/components/icons/AIIcon";

export default function AIGenerateButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center gap-3 w-full py-3 md:py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
            >
                <AIIcon size={18} />
                Generate with AI
            </button>
            {isOpen && (
                <AIGenerateModal onClose={() => setIsOpen(false)} onSuccess={() => {}} />
            )}
        </>
    );
}
