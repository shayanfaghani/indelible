"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    {
        label: "Home",
        href: "/dashboard",
        icon: (active: boolean) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
        ),
    },
    {
        label: "Review",
        href: "/review",
        icon: (active: boolean) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
        ),
    },
    {
        label: "Cards",
        href: "/cards",
        icon: (active: boolean) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={active ? 2.5 : 2}/>
                <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
        ),
    },
    {
        label: "Profile",
        href: "/profile",
        icon: (active: boolean) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth={active ? 2.5 : 2}/>
                <circle cx="12" cy="7" r="4" strokeWidth={active ? 2.5 : 2}/>
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/95 backdrop-blur border-t border-gray-800 safe-area-pb">
            <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
                {navItems.map(({ label, href, icon }) => {
                    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${
                                active ? "text-gold" : "text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            {icon(active)}
                            <span className={`text-[10px] font-medium tracking-wide ${active ? "text-gold" : ""}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
