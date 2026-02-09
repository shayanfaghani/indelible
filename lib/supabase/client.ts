import { createBrowserClient } from "@supabase/ssr";

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    user_id: string;
                    xp: number;
                    knowledge_net_value: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    xp?: number;
                    knowledge_net_value?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    xp?: number;
                    knowledge_net_value?: number;
                    created_at?: string;
                };
            };
            cards: {
                Row: {
                    id: string;
                    user_id: string;
                    front: string;
                    back: string;
                    box_level: number;
                    last_reviewed: string | null;
                    next_review_at: string;
                    is_vaulted: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    front: string;
                    back: string;
                    box_level?: number;
                    last_reviewed?: string | null;
                    next_review_at?: string;
                    is_vaulted?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    front?: string;
                    back?: string;
                    box_level?: number;
                    last_reviewed?: string | null;
                    next_review_at?: string;
                    is_vaulted?: boolean;
                    created_at?: string;
                };
            };
        };
    };
};

export const createClient = () =>
    createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
