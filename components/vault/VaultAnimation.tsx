"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface VaultAnimationProps {
    isVisible: boolean;
    onComplete: () => void;
}

export default function VaultAnimation({ isVisible, onComplete }: VaultAnimationProps) {
    const [particles, setParticles] = useState<number[]>([]);

    useEffect(() => {
        if (isVisible) {
            setParticles(Array.from({ length: 20 }, (_, i) => i));
            const timer = setTimeout(onComplete, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/90 backdrop-blur-sm"
                >
                    <div className="text-center">
                        {/* Main vault icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className="text-8xl mb-6"
                        >
                            🏛️
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl md:text-5xl font-bold text-gold mb-4"
                        >
                            Vaulted!
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xl text-emerald"
                        >
                            This knowledge is now permanent
                        </motion.p>

                        {/* Particles */}
                        {particles.map((i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: 0,
                                    y: 0,
                                    scale: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    x: Math.cos((i / particles.length) * Math.PI * 2) * 200,
                                    y: Math.sin((i / particles.length) * Math.PI * 2) * 200,
                                    scale: 1,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: 1.5,
                                    delay: 0.7 + i * 0.02,
                                    ease: "easeOut",
                                }}
                                className="absolute top-1/2 left-1/2 w-3 h-3 bg-gold rounded-full"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
