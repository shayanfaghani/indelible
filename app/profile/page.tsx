import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileForm from "./ProfileForm";

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

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <ProfileForm
                        profile={profile}
                        email={user.email || ""}
                        userId={user.id}
                    />
                </div>
            </div>
        </AuthGuard>
    );
}
