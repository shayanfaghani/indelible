"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose }: LogoutConfirmModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-black/50">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-xl font-semibold text-white text-center mb-2">
                    Are you sure you want to logout?
                </h3>
                <p className="text-gray-400 text-sm text-center mb-8">
                    You&apos;ll need to sign in again to access your cards.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-gray-800 text-gray-200 font-medium rounded-xl hover:bg-gray-700 transition-colors border border-gray-700 disabled:opacity-50"
                        id="logout-modal-no"
                    >
                        No
                    </button>
                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-red-500/90 text-white font-medium rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
                        id="logout-modal-yes"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Logging out…</span>
                            </div>
                        ) : (
                            "Yes"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
