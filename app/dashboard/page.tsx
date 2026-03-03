import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileMenu from "@/components/profile/ProfileMenu";

async function getDashboardData(userId: string) {
    const supabase = createServerClient();

    // Get profile
    const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

    // Get all cards
    const { data: allCards } = await (supabase as any)
        .from("cards")
        .select("*")
        .eq("user_id", userId);

    // Get due cards count
    const now = new Date().toISOString();
    const { data: dueCards } = await (supabase as any)
        .from("cards")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_at", now);

    // Get vaulted cards count
    const vaultedCount = allCards?.filter((c: any) => c.is_vaulted).length || 0;

    return {
        profile,
        totalCards: allCards?.length || 0,
        dueCardsCount: dueCards?.length || 0,
        vaultedCount,
    };
}

export default async function DashboardPage() {
    const supabase = createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { profile, totalCards, dueCardsCount, vaultedCount } = await getDashboardData(
        user.id
    );

    return (
        <AuthGuard>
            <div className="min-h-screen bg-obsidian p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gold">Indelible</h1>
                        <ProfileMenu
                            avatarUrl={profile?.avatar_url || null}
                            firstName={profile?.first_name || null}
                            lastName={profile?.last_name || null}
                        />
                    </div>

                    {/* Knowledge Net Value */}
                    <div className="bg-gradient-to-br from-gold/20 to-emerald/20 rounded-2xl p-8 mb-6 border border-gold/30">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                                Knowledge Net Value
                            </p>
                            <p className="text-5xl md:text-6xl font-bold text-gold mb-2">
                                {profile?.knowledge_net_value || 0}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {profile?.xp || 0} XP earned
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <p className="text-gray-400 text-sm mb-2">Due Today</p>
                            <p className="text-3xl font-bold text-white">{dueCardsCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <p className="text-gray-400 text-sm mb-2">In Vault</p>
                            <p className="text-3xl font-bold text-emerald">{vaultedCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <p className="text-gray-400 text-sm mb-2">Total Cards</p>
                            <p className="text-3xl font-bold text-white">{totalCards}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        <Link
                            href="/review"
                            className="block w-full py-4 bg-gold text-obsidian text-center font-semibold rounded-xl hover:bg-yellow-500 transition-all transform hover:scale-105"
                        >
                            {dueCardsCount > 0
                                ? `Review ${dueCardsCount} Card${dueCardsCount === 1 ? "" : "s"}`
                                : "No Cards Due Today"}
                        </Link>
                        <Link
                            href="/cards/new"
                            className="block w-full py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                        >
                            Add New Card
                        </Link>
                        <Link
                            href="/cards"
                            className="block w-full py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                        >
                            Browse All Cards
                        </Link>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
