"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface CardFlipProps {
    front: string;
    back: string;
    isFlipped: boolean;
    onFlip: () => void;
}

export default function CardFlip({ front, back, isFlipped, onFlip }: CardFlipProps) {
    return (
        <div className="perspective-1000 w-full max-w-2xl mx-auto">
            <motion.div
                className="relative w-full h-80 cursor-pointer"
                onClick={onFlip}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-gold/30 p-8 flex items-center justify-center"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="text-center">
                        <p className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Question</p>
                        <p className="text-2xl md:text-3xl text-white font-medium">{front}</p>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 backface-hidden bg-gradient-to-br from-emerald/20 to-gold/20 rounded-2xl border-2 border-emerald/30 p-8 flex items-center justify-center"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    <div className="text-center">
                        <p className="text-sm text-gray-400 mb-4 uppercase tracking-wider">Answer</p>
                        <p className="text-2xl md:text-3xl text-white font-medium">{back}</p>
                    </div>
                </div>
            </motion.div>

            <p className="text-center text-gray-500 text-sm mt-4">
                {isFlipped ? "Tap to see question" : "Tap to reveal answer"}
            </p>
        </div>
    );
}
