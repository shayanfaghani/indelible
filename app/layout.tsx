import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AudioFeedback from "@/components/AudioFeedback";
import ChatWidget from "@/components/chat/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Indelible - Lifelong Knowledge Mastery",
    description: "A minimalist spaced-repetition app with the Infinity Vault for permanent knowledge retention",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Indelible",
    },
};

export const viewport = {
    themeColor: "#0A0A0B",
};


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <AudioFeedback />
                {children}
                <ChatWidget />
            </body>
        </html>
    );
}
