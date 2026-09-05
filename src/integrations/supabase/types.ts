export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_private: boolean
          max_participants: string | null
          province: string | null
          start_date: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_participants?: string | null
          province?: string | null
          start_date?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_participants?: string | null
          province?: string | null
          start_date?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activity_categories: {
        Row: {
          created_at: string
          emoji: string | null
          icon: string | null
          id: string
          key: string
          label_en: string | null
          label_ja: string | null
          label_ko: string | null
          label_ru: string | null
          label_th: string
          label_zh: string | null
          parent_key: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          icon?: string | null
          id?: string
          key: string
          label_en?: string | null
          label_ja?: string | null
          label_ko?: string | null
          label_ru?: string | null
          label_th: string
          label_zh?: string | null
          parent_key?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          icon?: string | null
          id?: string
          key?: string
          label_en?: string | null
          label_ja?: string | null
          label_ko?: string | null
          label_ru?: string | null
          label_th?: string
          label_zh?: string | null
          parent_key?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_categories_parent_key_fkey"
            columns: ["parent_key"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["key"]
          },
        ]
      }
      activity_checkins: {
        Row: {
          category: string | null
          checked_in_at: string
          created_at: string
          group_chat_id: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checked_in_at?: string
          created_at?: string
          group_chat_id: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string | null
          checked_in_at?: string
          created_at?: string
          group_chat_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_checkins_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_group_chats: {
        Row: {
          activity_id: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_group_chats_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      check_plus_checkins: {
        Row: {
          category: string
          checked_in_at: string
          code_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          checked_in_at?: string
          code_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          checked_in_at?: string
          code_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_plus_checkins_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "check_plus_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      check_plus_codes: {
        Row: {
          category: string
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          used_count: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          media_type: string | null
          media_url: string | null
          reactions: Json | null
          read_at: string | null
          receiver_id: string
          reply_preview: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id: string
          reply_preview?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          read_at?: string | null
          receiver_id?: string
          reply_preview?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      duo_cooldowns: {
        Row: {
          available_at: string
          created_at: string
          user_id: string
        }
        Insert: {
          available_at: string
          created_at?: string
          user_id: string
        }
        Update: {
          available_at?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      duo_pairs: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      duo_requests: {
        Row: {
          created_at: string
          from_user: string
          id: string
          responded_at: string | null
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          responded_at?: string | null
          status?: string
          to_user?: string
        }
        Relationships: []
      }
      fast_checkins: {
        Row: {
          category: string
          checked_in_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          checked_in_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          checked_in_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      funding_contributions: {
        Row: {
          amount: number
          created_at: string
          direction: string
          id: string
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          direction?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          direction?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      funding_pool: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          is_active: boolean
          target_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean
          target_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          is_active?: boolean
          target_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      group_chat_last_read: {
        Row: {
          group_chat_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_last_read_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_members: {
        Row: {
          group_chat_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_messages: {
        Row: {
          content: string
          created_at: string
          group_chat_id: string
          id: string
          is_deleted: boolean | null
          media_type: string | null
          media_url: string | null
          reactions: Json | null
          reply_preview: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_chat_id: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          reply_preview?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_chat_id?: string
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reactions?: Json | null
          reply_preview?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          group_chat_id: string
          id: string
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_chat_id: string
          id?: string
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_chat_id?: string
          id?: string
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      kicked_members: {
        Row: {
          group_chat_id: string
          id: string
          kicked_at: string
          kicked_by: string
          user_id: string
        }
        Insert: {
          group_chat_id: string
          id?: string
          kicked_at?: string
          kicked_by: string
          user_id: string
        }
        Update: {
          group_chat_id?: string
          id?: string
          kicked_at?: string
          kicked_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kicked_members_group_chat_id_fkey"
            columns: ["group_chat_id"]
            isOneToOne: false
            referencedRelation: "activity_group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_mutes: {
        Row: {
          chat_id: string
          chat_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          chat_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          chat_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          reel_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reel_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reel_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          check_plus_points: number | null
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          plan_type: string
          premium_days: number
          star_coins_amount: number | null
        }
        Insert: {
          check_plus_points?: number | null
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          plan_type?: string
          premium_days?: number
          star_coins_amount?: number | null
        }
        Update: {
          check_plus_points?: number | null
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          plan_type?: string
          premium_days?: number
          star_coins_amount?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reel_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          reel_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_reports_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          music_name: string | null
          thumbnail_url: string | null
          user_id: string
          video_url: string
          views_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          music_name?: string | null
          thumbnail_url?: string | null
          user_id: string
          video_url: string
          views_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          music_name?: string | null
          thumbnail_url?: string | null
          user_id?: string
          video_url?: string
          views_count?: number
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          key: string
          label_en: string | null
          label_th: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          key: string
          label_en?: string | null
          label_th: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          key?: string
          label_en?: string | null
          label_th?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          province: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          province?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          province?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          created_at: string
          days_added: number
          duration: string | null
          id: string
          plan_type: string
          premium_until_after: string | null
          price: number | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_added: number
          duration?: string | null
          id?: string
          plan_type: string
          premium_until_after?: string | null
          price?: number | null
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_added?: number
          duration?: string | null
          id?: string
          plan_type?: string
          premium_until_after?: string | null
          price?: number | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_code_redemptions: {
        Row: {
          code_owner_id: string
          id: string
          redeemed_at: string
          redeemer_id: string
        }
        Insert: {
          code_owner_id: string
          id?: string
          redeemed_at?: string
          redeemer_id: string
        }
        Update: {
          code_owner_id?: string
          id?: string
          redeemed_at?: string
          redeemer_id?: string
        }
        Relationships: []
      }
      user_premium: {
        Row: {
          created_at: string
          id: string
          plan_type: string
          premium_until: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_type?: string
          premium_until: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_type?: string
          premium_until?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reel_preferences: {
        Row: {
          category: string
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          id?: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_activity: string | null
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          check_plus_points: number
          created_at: string | null
          display_name: string | null
          email: string | null
          hope_coins: number
          id: string
          last_login: string | null
          phone: string | null
          role: string | null
          star_coins: number
          status: string | null
          theme: string | null
          theme_custom: Json | null
          user_code: string | null
          user_code_use_count: number
        }
        Insert: {
          avatar_activity?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          check_plus_points?: number
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          hope_coins?: number
          id: string
          last_login?: string | null
          phone?: string | null
          role?: string | null
          star_coins?: number
          status?: string | null
          theme?: string | null
          theme_custom?: Json | null
          user_code?: string | null
          user_code_use_count?: number
        }
        Update: {
          avatar_activity?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          check_plus_points?: number
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          hope_coins?: number
          id?: string
          last_login?: string | null
          phone?: string | null
          role?: string | null
          star_coins?: number
          status?: string | null
          theme?: string | null
          theme_custom?: Json | null
          user_code?: string | null
          user_code_use_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_blocked: {
        Args: { user1: string; user2: string }
        Returns: boolean
      }
      cancel_duo: { Args: never; Returns: Json }
      cancel_duo_request: { Args: { _request_id: string }; Returns: Json }
      delete_follow_notification: {
        Args: { p_actor_id: string; p_user_id: string }
        Returns: undefined
      }
      delete_my_account: { Args: never; Returns: Json }
      generate_user_code: { Args: never; Returns: string }
      get_duo_partner: { Args: { _user_id: string }; Returns: string }
      get_duo_status: { Args: { _other: string }; Returns: Json }
      get_group_chat_previews: {
        Args: { _ids: string[] }
        Returns: {
          content: string
          created_at: string
          group_chat_id: string
          media_type: string
          member_count: number
        }[]
      }
      get_my_contact_info: {
        Args: never
        Returns: {
          birthday: string
          email: string
          phone: string
        }[]
      }
      has_active_duo: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_reel_views: { Args: { _reel_id: string }; Returns: undefined }
      is_blocked: {
        Args: { blocked: string; blocker: string }
        Returns: boolean
      }
      is_group_chat_owner: {
        Args: { _group_chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_chat_id: string; _user_id: string }
        Returns: boolean
      }
      perform_activity_checkin: {
        Args: { _group_chat_id: string }
        Returns: Json
      }
      perform_check_plus_checkin: { Args: { _category: string }; Returns: Json }
      perform_fast_checkin: { Args: { _category: string }; Returns: Json }
      redeem_promo_code: { Args: { p_code: string }; Returns: Json }
      redeem_subscription_with_coins: {
        Args: { _currency: string; _duration: string; _plan: string }
        Returns: Json
      }
      redeem_user_code: { Args: { p_code: string }; Returns: Json }
      reset_all_checkins: { Args: never; Returns: undefined }
      respond_duo_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: Json
      }
      send_duo_request: { Args: { _target: string }; Returns: Json }
      spend_hope_coins_on_funding: {
        Args: { _amount: number; _direction: string }
        Returns: Json
      }
      upsert_follow_notification: {
        Args: { p_actor_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
