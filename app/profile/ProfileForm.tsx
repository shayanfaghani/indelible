"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Profile {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    xp: number;
    knowledge_net_value: number;
}

interface ProfileFormProps {
    profile: Profile | null;
    email: string;
    userId: string;
}

export default function ProfileForm({ profile, email, userId }: ProfileFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [firstName, setFirstName] = useState(profile?.first_name || "");
    const [lastName, setLastName] = useState(profile?.last_name || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image must be under 2MB" });
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            // Upload avatar first if a new one is selected
            let newAvatarUrl = avatarUrl;
            if (avatarFile) {
                setIsUploadingAvatar(true);
                const formData = new FormData();
                formData.append("file", avatarFile);

                const uploadRes = await fetch("/api/profile/avatar", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.error || "Failed to upload avatar");
                }

                const { url } = await uploadRes.json();
                newAvatarUrl = url;
                setIsUploadingAvatar(false);
            }

            // Update profile
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || null,
                    avatar_url: newAvatarUrl || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update profile");
            }

            setAvatarUrl(newAvatarUrl);
            setAvatarFile(null);
            setAvatarPreview(null);
            setMessage({ type: "success", text: "Profile updated successfully!" });

            // Refresh server components to pick up new data
            router.refresh();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Something went wrong" });
            setIsUploadingAvatar(false);
        } finally {
            setIsSaving(false);
        }
    };

    const displayAvatar = avatarPreview || avatarUrl;
    const initials = getInitials(firstName, lastName);

    return (
        <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gold">Profile</h1>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gold/30 group-hover:border-gold/60 transition-all duration-300 shadow-lg shadow-gold/10">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gold/80 to-gold flex items-center justify-center">
                                <span className="text-obsidian font-bold text-3xl">
                                    {initials}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Upload overlay */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 w-28 h-28 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                    >
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarSelect}
                        className="hidden"
                    />
                </div>

                <p className="text-gray-500 text-xs mt-3">
                    Click to change photo · Max 2MB
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
                {/* First Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        First Name
                    </label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                        placeholder="Enter your first name"
                        id="profile-first-name"
                    />
                </div>

                {/* Last Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Last Name
                    </label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                        placeholder="Enter your last name"
                        id="profile-last-name"
                    />
                </div>

                {/* Email (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-500 cursor-not-allowed"
                        id="profile-email"
                    />
                    <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Phone Number
                        <span className="text-gray-600 ml-1">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                        placeholder="+1 (555) 123-4567"
                        id="profile-phone"
                    />
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mt-6 p-4 rounded-xl text-sm ${message.type === "success"
                            ? "bg-emerald/10 border border-emerald/20 text-emerald"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Save Button */}
            <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-8 py-4 bg-gold text-obsidian font-semibold rounded-xl hover:bg-yellow-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                id="profile-save"
            >
                {isSaving ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" />
                        <span>{isUploadingAvatar ? "Uploading photo…" : "Saving…"}</span>
                    </div>
                ) : (
                    "Save Changes"
                )}
            </button>
        </form>
    );
}

function getInitials(firstName: string, lastName: string): string {
    const f = firstName?.trim()?.[0]?.toUpperCase() || "";
    const l = lastName?.trim()?.[0]?.toUpperCase() || "";
    if (f || l) return f + l;
    return "U";
}
