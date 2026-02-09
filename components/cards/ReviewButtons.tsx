"use client";

import { motion } from "framer-motion";

interface ReviewButtonsProps {
    onForgot: () => void;
    onHard: () => void;
    onGotIt: () => void;
    disabled?: boolean;
}

export default function ReviewButtons({
    onForgot,
    onHard,
    onGotIt,
    disabled = false,
}: ReviewButtonsProps) {
    return (
        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
            <motion.button
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={onForgot}
                disabled={disabled}
                className="py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Forgot
            </motion.button>

            <motion.button
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={onHard}
                disabled={disabled}
                className="py-4 bg-yellow-600 text-white font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Hard
            </motion.button>

            <motion.button
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={onGotIt}
                disabled={disabled}
                className="py-4 bg-emerald text-white font-semibold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Got it!
            </motion.button>
        </div>
    );
}
