"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { CONTACT_CONFIG, REQUEST_TYPES, type RequestType } from "@/lib/config/contact";

interface Profile {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
}

export default function ContactPage() {
    const [profile, setProfile] = useState<Profile>({ first_name: null, last_name: null, phone: null, email: null });
    const [requestType, setRequestType] = useState<RequestType | "">("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data) => {
                if (data.profile) setProfile(data.profile);
            })
            .catch(() => {});
    }, []);

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "";
    const charsLeft = CONTACT_CONFIG.MAX_MESSAGE_CHARS - message.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestType || !message.trim()) return;

        setStatus("submitting");
        setErrorMsg("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestType,
                    message,
                    name: fullName,
                    phone: profile.phone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");
            setStatus("success");
        } catch (err: any) {
            setErrorMsg(err.message);
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h2 className="text-white text-xl font-semibold mb-2">Message Sent</h2>
                        <p className="text-gray-400 text-sm mb-6">Thanks for reaching out. We'll get back to you soon.</p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-2.5 bg-gold text-obsidian font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="text-gray-400 hover:text-white transition-colors mr-4"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl font-bold text-white">Contact Us</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Pre-filled user info */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your Info</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        disabled
                                        className="w-full bg-gray-800/60 text-gray-400 rounded-lg px-3 py-2.5 text-sm border border-gray-700/50 cursor-not-allowed"
                                        placeholder="—"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email || ""}
                                        disabled
                                        className="w-full bg-gray-800/60 text-gray-400 rounded-lg px-3 py-2.5 text-sm border border-gray-700/50 cursor-not-allowed"
                                        placeholder="—"
                                    />
                                </div>
                            </div>
                            {profile.phone && (
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        disabled
                                        className="w-full bg-gray-800/60 text-gray-400 rounded-lg px-3 py-2.5 text-sm border border-gray-700/50 cursor-not-allowed"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Request type */}
                        <div>
                            <label className="block text-sm text-gray-300 mb-2 font-medium">
                                What can we help you with?
                            </label>
                            <select
                                value={requestType}
                                onChange={(e) => {
                                    setRequestType(e.target.value as RequestType);
                                    setMessage("");
                                }}
                                className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:border-gold focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Select a request type…</option>
                                {REQUEST_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Message — only shown after type is selected */}
                        {requestType && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-gray-300 font-medium">Message</label>
                                    <span className={`text-xs ${charsLeft < 50 ? "text-red-400" : "text-gray-500"}`}>
                                        {charsLeft} characters remaining
                                    </span>
                                </div>
                                <textarea
                                    value={message}
                                    onChange={(e) => {
                                        if (e.target.value.length <= CONTACT_CONFIG.MAX_MESSAGE_CHARS) {
                                            setMessage(e.target.value);
                                        }
                                    }}
                                    rows={5}
                                    placeholder="Describe your request in detail…"
                                    className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:border-gold focus:outline-none resize-none placeholder-gray-600"
                                />
                            </div>
                        )}

                        {/* Error */}
                        {status === "error" && (
                            <p className="text-red-400 text-sm">{errorMsg}</p>
                        )}

                        {/* Actions */}
                        {requestType && (
                            <div className="flex gap-3 pt-1 animate-in fade-in duration-200">
                                <button
                                    type="submit"
                                    disabled={!message.trim() || status === "submitting"}
                                    className="flex-1 py-3 bg-gold text-obsidian font-semibold rounded-xl hover:bg-yellow-500 transition-colors disabled:opacity-40"
                                >
                                    {status === "submitting" ? "Sending…" : "Submit"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/dashboard")}
                                    className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors border border-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthGuard>
    );
}
