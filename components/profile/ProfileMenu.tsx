"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutConfirmModal from "../profile/LogoutConfirmModal";

interface ProfileMenuProps {
    avatarUrl: string | null;
    firstName: string | null;
    lastName: string | null;
}

export default function ProfileMenu({ avatarUrl, firstName, lastName }: ProfileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const initials = getInitials(firstName, lastName);

    return (
        <>
            <div className="relative" ref={menuRef}>
                {/* Avatar Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/50 hover:border-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-obsidian"
                    aria-label="Profile menu"
                    id="profile-menu-button"
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gold/80 to-gold flex items-center justify-center">
                            <span className="text-obsidian font-semibold text-sm">
                                {initials}
                            </span>
                        </div>
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push("/profile");
                            }}
                            className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-gold transition-colors flex items-center gap-3 rounded-t-xl"
                            id="profile-menu-profile"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </button>
                        <div className="border-t border-gray-700/50 mx-2" />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push("/contact");
                            }}
                            className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-gold transition-colors flex items-center gap-3"
                            id="profile-menu-contact"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Us
                        </button>
                        <div className="border-t border-gray-700/50 mx-2" />
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowLogoutModal(true);
                            }}
                            className="w-full text-left px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-red-400 transition-colors flex items-center gap-3 rounded-b-xl"
                            id="profile-menu-logout"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
            />
        </>
    );
}

function getInitials(firstName: string | null, lastName: string | null): string {
    const f = firstName?.trim()?.[0]?.toUpperCase() || "";
    const l = lastName?.trim()?.[0]?.toUpperCase() || "";
    if (f || l) return f + l;
    return "U";
}
