import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileForm from "./ProfileForm";
import BottomNav from "@/components/nav/BottomNav";

export default async function ProfilePage() {
    const supabase = createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get profile data
    const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    // Feature flag: push notifications are temporarily disabled for all users.
    // Set PUSH_NOTIFICATIONS_ENABLED=true to bring the "Daily Reminders" section back.
    const pushNotificationsEnabled = process.env.PUSH_NOTIFICATIONS_ENABLED === "true";

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8 pb-24 md:pb-24">
                <div className="max-w-2xl mx-auto">
                    <ProfileForm
                        profile={profile}
                        email={user.email || ""}
                        userId={user.id}
                        pushNotificationsEnabled={pushNotificationsEnabled}
                    />
                </div>
            </div>
            <BottomNav />
        </AuthGuard>
    );
}
