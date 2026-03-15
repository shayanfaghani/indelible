import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileMenu from "@/components/profile/ProfileMenu";
import WordSlideshow from "@/components/dashboard/WordSlideshow";
import essentialWords from "@/lib/data/essential-words";

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
                    <div className="flex justify-between items-center mb-4 md:mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gold">Indelible</h1>
                        <ProfileMenu
                            avatarUrl={profile?.avatar_url || null}
                            firstName={profile?.first_name || null}
                            lastName={profile?.last_name || null}
                        />
                    </div>

                    {/* Knowledge Net Value */}
                    <div className="bg-gradient-to-br from-gold/20 to-emerald/20 rounded-2xl p-4 md:p-8 mb-3 md:mb-6 border border-gold/30">
                        <div className="text-center">
                            <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2">
                                Knowledge Net Value
                            </p>
                            <p className="text-3xl md:text-6xl font-bold text-gold mb-1 md:mb-2">
                                {profile?.knowledge_net_value || 0}
                            </p>
                            <p className="text-gray-400 text-xs md:text-sm">
                                {profile?.xp || 0} XP earned
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-8">
                        <div className="bg-gray-900 rounded-xl p-3 md:p-6 border border-gray-800">
                            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Due Today</p>
                            <p className="text-xl md:text-3xl font-bold text-white">{dueCardsCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-3 md:p-6 border border-gray-800">
                            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald hidden md:block"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                                <p className="text-gray-400 text-xs md:text-sm">In Vault</p>
                            </div>
                            <p className="text-xl md:text-3xl font-bold text-emerald">{vaultedCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl p-3 md:p-6 border border-gray-800">
                            <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">Total Cards</p>
                            <p className="text-xl md:text-3xl font-bold text-white">{totalCards}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: nudge + actions */}
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Due cards nudge */}
                            {dueCardsCount > 0 && (
                                <div className="flex items-center gap-3 bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 md:px-5 md:py-4">
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold"></span>
                                    </span>
                                    <p className="text-gold text-sm font-medium">
                                        You have <span className="font-bold">{dueCardsCount} card{dueCardsCount === 1 ? "" : "s"}</span> waiting for review today.
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <Link
                                    href="/review"
                                    className="flex items-center justify-center gap-3 w-full py-3 md:py-4 bg-gold text-obsidian text-center font-semibold rounded-xl hover:bg-yellow-500 transition-all transform hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    {dueCardsCount > 0
                                        ? `Review ${dueCardsCount} Card${dueCardsCount === 1 ? "" : "s"}`
                                        : "No Cards Due Today"}
                                </Link>
                                <Link
                                    href="/cards/new"
                                    className="flex items-center justify-center gap-3 w-full py-3 md:py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    Add New Card
                                </Link>
                                <Link
                                    href="/cards"
                                    className="flex items-center justify-center gap-3 w-full py-3 md:py-4 bg-gray-800 text-white text-center font-semibold rounded-xl hover:bg-gray-700 transition-all border border-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                                    Browse All Cards
                                </Link>
                            </div>
                        </div>{/* end left col */}

                        {/* Right: word slideshow (desktop only) */}
                        <div className="hidden md:flex md:w-72 lg:w-80 shrink-0">
                            <WordSlideshow words={essentialWords} />
                        </div>
                    </div>{/* end flex row */}
                </div>
            </div>
        </AuthGuard>
    );
}
