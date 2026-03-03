export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    first_name: string | null
                    last_name: string | null
                    phone: string | null
                    avatar_url: string | null
                    xp: number
                    knowledge_net_value: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    first_name?: string | null
                    last_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    xp?: number
                    knowledge_net_value?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    first_name?: string | null
                    last_name?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    xp?: number
                    knowledge_net_value?: number
                    created_at?: string
                }
            }
            cards: {
                Row: {
                    id: string
                    user_id: string
                    front: string
                    back: string
                    box_level: number
                    last_reviewed: string | null
                    next_review_at: string
                    is_vaulted: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    front: string
                    back: string
                    box_level?: number
                    last_reviewed?: string | null
                    next_review_at?: string
                    is_vaulted?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    front?: string
                    back?: string
                    box_level?: number
                    last_reviewed?: string | null
                    next_review_at?: string
                    is_vaulted?: boolean
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
