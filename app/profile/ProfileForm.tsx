"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestPermission, subscribeToPush, unsubscribeFromPush, saveSubscription, deleteSubscription } from "@/lib/notifications";

const TIMEZONES = [
    { value: "Pacific/Honolulu",    label: "Hawaii (UTC−10)" },
    { value: "America/Anchorage",   label: "Alaska (UTC−9)" },
    { value: "America/Los_Angeles", label: "Pacific Time (UTC−8/−7)" },
    { value: "America/Denver",      label: "Mountain Time (UTC−7/−6)" },
    { value: "America/Chicago",     label: "Central Time (UTC−6/−5)" },
    { value: "America/New_York",    label: "Eastern Time (UTC−5/−4)" },
    { value: "America/Sao_Paulo",   label: "Brazil (UTC−3)" },
    { value: "Atlantic/Azores",     label: "Azores (UTC−1)" },
    { value: "Europe/London",       label: "London (UTC+0/+1)" },
    { value: "Europe/Paris",        label: "Central Europe (UTC+1/+2)" },
    { value: "Europe/Rome",         label: "Rome / Milan (UTC+1/+2)" },
    { value: "Europe/Helsinki",     label: "Eastern Europe (UTC+2/+3)" },
    { value: "Europe/Moscow",       label: "Moscow (UTC+3)" },
    { value: "Asia/Dubai",          label: "Dubai (UTC+4)" },
    { value: "Asia/Karachi",        label: "Pakistan (UTC+5)" },
    { value: "Asia/Kolkata",        label: "India (UTC+5:30)" },
    { value: "Asia/Dhaka",          label: "Bangladesh (UTC+6)" },
    { value: "Asia/Bangkok",        label: "Bangkok (UTC+7)" },
    { value: "Asia/Singapore",      label: "Singapore / KL (UTC+8)" },
    { value: "Asia/Tokyo",          label: "Tokyo (UTC+9)" },
    { value: "Australia/Sydney",    label: "Sydney (UTC+10/+11)" },
    { value: "Pacific/Auckland",    label: "New Zealand (UTC+12/+13)" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`,
}));

const MINUTES = [
    { value: "00", label: ":00" },
    { value: "15", label: ":15" },
    { value: "30", label: ":30" },
    { value: "45", label: ":45" },
];

interface Profile {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    xp: number;
    knowledge_net_value: number;
    notifications_enabled: boolean | null;
    notification_time: string | null;
    timezone: string | null;
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

    // Notification state
    const parseTime = (t: string | null) => {
        if (!t) return { hour: 9, minute: "00" };
        const [h, m] = t.split(":");
        return { hour: parseInt(h, 10), minute: m || "00" };
    };
    const savedTime = parseTime(profile?.notification_time || null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? false);
    const [notifHour, setNotifHour] = useState(savedTime.hour);
    const [notifMinute, setNotifMinute] = useState(savedTime.minute);
    const [timezone, setTimezone] = useState(profile?.timezone || (typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York"));
    const [isTogglingNotif, setIsTogglingNotif] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleToggleNotifications = async () => {
        setIsTogglingNotif(true);
        try {
            if (!notificationsEnabled) {
                const granted = await requestPermission();
                if (!granted) {
                    setMessage({ type: "error", text: "Notification permission denied. Please enable it in your browser settings." });
                    return;
                }
                const sub = await subscribeToPush();
                await saveSubscription(sub);
                setNotificationsEnabled(true);
            } else {
                const sub = await unsubscribeFromPush();
                if (sub) await deleteSubscription(sub.endpoint);
                setNotificationsEnabled(false);
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update notification settings" });
        } finally {
            setIsTogglingNotif(false);
        }
    };

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
                    notifications_enabled: notificationsEnabled,
                    notification_time: `${String(notifHour).padStart(2, "0")}:${notifMinute}`,
                    timezone: timezone || null,
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

            {/* Notifications Section */}
            <div className="mt-8 pt-8 border-t border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-1">Daily Reminders</h2>
                <p className="text-gray-500 text-sm mb-5">Get a push notification to review your cards each day.</p>

                {/* Toggle */}
                <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-medium text-gray-300">Enable notifications</span>
                    <button
                        type="button"
                        onClick={handleToggleNotifications}
                        disabled={isTogglingNotif}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${notificationsEnabled ? "bg-gold" : "bg-gray-700"} disabled:opacity-50`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${notificationsEnabled ? "translate-x-6" : "translate-x-1"}`}
                        />
                    </button>
                </div>

                {/* Time & Timezone pickers — shown only when enabled */}
                {notificationsEnabled && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Reminder time</label>
                            <div className="flex gap-3">
                                <select
                                    value={notifHour}
                                    onChange={(e) => setNotifHour(Number(e.target.value))}
                                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                                >
                                    {HOURS.map((h) => (
                                        <option key={h.value} value={h.value}>{h.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={notifMinute}
                                    onChange={(e) => setNotifMinute(e.target.value)}
                                    className="w-28 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                                >
                                    {MINUTES.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-colors"
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
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
