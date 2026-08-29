export type ItemStatus = "active" | "matched" | "recovered" | "archived" | "removed";
export type ItemCategory =
  | "phones" | "wallets" | "ids" | "bags" | "keys" | "jewelry"
  | "electronics" | "documents" | "clothing" | "pets" | "school_items" | "other";
export type UserRole = "user" | "moderator" | "admin";
export type ConversationItemType = "lost_item" | "found_item";
export type NotificationType = "new_message" | "possible_match" | "report_update" | "item_returned" | "moderation_action";
export type FlagReason = "scam" | "fake_report" | "harassment" | "suspicious_behavior" | "inappropriate_content" | "wrong_information" | "impersonation" | "other";
export type FlagStatus = "pending" | "under_review" | "reviewed" | "resolved" | "dismissed";

// Interfaces don't carry implicit index signatures, which stops them from being
// assignable to the library's `GenericTable["Row"]` (`Record<string, unknown>`),
// so the schema would fail to satisfy `GenericSchema`. Object type aliases do have
// implicit index signatures, matching what `supabase gen types` actually emits.
export type Profile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  role: UserRole;
  successful_returns: number;
  is_suspended: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id: string | null;
  status: "new" | "read";
  created_at: string;
};

export type LostItem = {
  id: string;
  reporter_id: string;
  title: string;
  category: ItemCategory;
  description: string;
  distinguishing_features: string | null;
  date_lost: string;
  city: string;
  province: string;
  approximate_location: string | null;
  // Optional map-pin coordinates (Philippines-only picker). Nullable for
  // reports created before the map feature or without a pin.
  latitude: number | null;
  longitude: number | null;
  reward_amount: number | null;
  // Denormalized page-view counter ("👁 N views"), RPC-managed only
  // (supabase/104-item-views.sql). Present after that migration runs.
  view_count?: number | null;
  // status/category are widened beyond the DB enums for read/filter typing:
  // list pages pass raw URL-param strings to .eq("status"/"category", ...),
  // which postgrest-js v2 strictly types against Row. Writes remain
  // constrained (see Insert below) and Zod validates user input.
  status: ItemStatus | string;
  created_at: string;
  updated_at: string;
};

export type FoundItem = {
  id: string;
  reporter_id: string;
  title: string;
  // item_category is a Postgres ENUM (schema.sql:19), so reads are always
  // valid members. Raw-string filters go through explicit casts at the
  // individual .eq() call sites instead of widening this read type.
  category: ItemCategory;
  description: string;
  distinguishing_features: string | null;
  date_found: string;
  city: string;
  province: string;
  approximate_location: string | null;
  // Optional map-pin coordinates (see LostItem).
  latitude: number | null;
  longitude: number | null;
  current_holding_info: string | null;
  // Denormalized page-view counter, RPC-managed only (see LostItem).
  view_count?: number | null;
  status: ItemStatus | string;
  created_at: string;
  updated_at: string;
};

export type ItemImage = {
  id: string;
  lost_item_id: string | null;
  found_item_id: string | null;
  storage_path: string;
  position: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  item_type: ConversationItemType;
  item_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_by_receiver: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type ItemMatch = {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  score: number | null;
  dismissed: boolean;
  created_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  lost_item_id: string | null;
  found_item_id: string | null;
  created_at: string;
};

export type ReportFlag = {
  id: string;
  item_type: ConversationItemType;
  item_id: string;
  reporter_id: string;
  reason: FlagReason;
  details: string | null;
  status: FlagStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

/** Phase 12 — a report filed against another member's behaviour. */
export type UserFlag = {
  id: string;
  reporter_id: string;
  target_user_id: string;
  reason: FlagReason;
  details: string | null;
  status: FlagStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

/** Phase 12 — one-sided block between members. */
export type BlockedUser = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

/** Phase 7 - ownership verification challenge. Answer hashes are NEVER exposed
 * through the API (column-level grants in supabase/trust.sql), so this type
 * only models the columns any caller may legitimately see.
 */
export type OwnershipVerification = {
  id: string;
  item_type: ConversationItemType;
  item_id: string;
  owner_id: string;
  question_1: string;
  question_2: string | null;
  updated_at: string;
};


/** Phase 2 — server-persisted possible-match alert preferences (one row per user). */
export type AlertPreference = {
  user_id: string;
  enable_match_alerts: boolean;
  match_city: string | null;
  match_category: string | null;
  last_notified_at: string | null;
  updated_at: string;
};

/** Phase 16 — 3-tap "Did it reunite?" user signal. Unique per (user, report). */
export type ReuniteFeedback = {
  id: string;
  user_id: string;
  item_type: ConversationItemType;
  item_id: string;
  reunited: boolean;
  rating: number | null;
  created_at: string;
};

// Minimal Supabase generated-types shape — hand-written to match schema.sql.
// Regenerate with `supabase gen types typescript` once the project is live for full accuracy.
//
// NOTE: The installed @supabase/supabase-js expects each Database schema to extend
// its `GenericSchema` type, which requires the `Views` and `Functions` keys, and each
// table to declare `Relationships`. Without them the schema is inferred as `never`
// and every query builder call loses its types.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string; first_name: string; last_name: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      lost_items: {
        Row: LostItem;
        Insert: Omit<LostItem, "id" | "created_at" | "updated_at" | "status"> & { status?: ItemStatus };
        // Index signature disables postgrest-js v2 excess-property rejection
        // for the shared lost/found update path in my-reports.ts.
        Update: Partial<LostItem> & { [key: string]: unknown };
        Relationships: [
          {
            foreignKeyName: "lost_items_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      found_items: {
        Row: FoundItem;
        Insert: Omit<FoundItem, "id" | "created_at" | "updated_at" | "status"> & { status?: ItemStatus };
        // See lost_items.Update note re: index signature.
        Update: Partial<FoundItem> & { [key: string]: unknown };
        Relationships: [
          {
            foreignKeyName: "found_items_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      item_images: {
        Row: ItemImage;
        Insert: Omit<ItemImage, "id" | "created_at">;
        Update: Partial<ItemImage>;
        Relationships: [];
      };
            locations: {
        Row: { id: number; city: string; province: string };
        Insert: { city: string; province: string };
        Update: never;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at">;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at" | "read_by_receiver">;
        Update: Partial<Message>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "read" | "created_at">;
        Update: Partial<Notification>;
        Relationships: [];
      };
      matches: {
        Row: ItemMatch;
        Insert: Omit<ItemMatch, "id" | "created_at" | "dismissed">;
        Update: Partial<ItemMatch>;
        Relationships: [
          {
            foreignKeyName: "matches_lost_item_id_fkey";
            columns: ["lost_item_id"];
            isOneToOne: false;
            referencedRelation: "lost_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_found_item_id_fkey";
            columns: ["found_item_id"];
            isOneToOne: false;
            referencedRelation: "found_items";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_items: {
        Row: SavedItem;
        Insert: Omit<SavedItem, "id" | "created_at">;
        Update: Partial<SavedItem>;
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_items_lost_item_id_fkey";
            columns: ["lost_item_id"];
            isOneToOne: false;
            referencedRelation: "lost_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_items_found_item_id_fkey";
            columns: ["found_item_id"];
            isOneToOne: false;
            referencedRelation: "found_items";
            referencedColumns: ["id"];
          },
        ];
      };
      report_flags: {
        Row: ReportFlag;
        Insert: Omit<ReportFlag, "id" | "status" | "created_at" | "reviewed_at" | "reviewed_by">;
        Update: Partial<ReportFlag>;
        Relationships: [
          {
            foreignKeyName: "report_flags_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_flags_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ownership_verifications: {
        // Selectable Row deliberately omits answer hashes (column-level grants
        // in supabase/trust.sql), but writes still carry them.
        Row: OwnershipVerification;
        Insert: Omit<OwnershipVerification, "id"> & {
          answer_1_hash: string;
          answer_2_hash?: string | null;
          updated_at?: string;
        };
        Update: Partial<{ question_1: string; question_2: string | null; answer_1_hash: string; answer_2_hash: string | null; updated_at: string }>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Omit<ContactMessage, "id" | "created_at" | "status"> & { status?: "new" | "read" };
        Update: Partial<ContactMessage>;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string };
        Insert: Omit<{ id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string }, "id" | "created_at">;
        Update: Partial<{ id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string }>;
        Relationships: [];
      };
      user_flags: {
        Row: UserFlag;
        Insert: Omit<UserFlag, "id" | "status" | "created_at" | "reviewed_at" | "reviewed_by">;
        Update: Partial<UserFlag>;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUser;
        Insert: Omit<BlockedUser, "created_at">;
        Update: Partial<BlockedUser>;
        Relationships: [];
      };
      alert_preferences: {
        Row: AlertPreference;
        Insert: Omit<AlertPreference, "user_id" | "last_notified_at"> & {
          user_id: string;
          updated_at?: string;
          last_notified_at?: string | null;
        };
        Update: Partial<AlertPreference>;
        Relationships: [];
      };
      reunite_feedback: {
        Row: ReuniteFeedback;
        Insert: Omit<ReuniteFeedback, "id" | "created_at" | "rating"> & {
          rating?: number | null;
        };
        Update: Partial<ReuniteFeedback>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /**
       * Member profiles — real "email confirmed" signal for an arbitrary user
       * id (lookup only; never returns account data). Used by /member/[id].
       */
      is_email_verified: {
        Args: { p_uid: string };
        Returns: boolean;
      };
      /** Phase 7 — pass/fail ownership check done inside Postgres. */
      verify_ownership_answers: {
        Args: { p_item_type: string; p_item_id: string; p_answer_1: string; p_answer_2?: string | null };
        Returns: unknown;
      };
      /** Phase 7 — challenge questions + caller's own pass state. */
      get_ownership_challenge: {
        Args: { p_item_type: string; p_item_id: string };
        Returns: unknown;
      };
      /**
       * Notifications & Activity — dedupe-safe notification insert used by the
       * matching engine, recovery flow and moderation actions. Skips the insert
       * when an identical UNREAD notification already exists for the user.
       */
      notify_user_once: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_title: string;
          p_message: string;
          p_link?: string | null;
        };
        Returns: undefined;
      };
      /** Phase — read receipts: participant marks the other party's messages read. */
      mark_messages_read: {
        Args: { p_conversation_id: string };
        Returns: undefined;
      };
      /**
       * Public view counter for lost/found reports (supabase/104-item-views.sql).
       * SECURITY DEFINER — bumps `view_count` by exactly 1; the only sanctioned
       * write path for the counter (column UPDATE grants are revoked).
       */
      increment_item_view_count: {
        Args: { p_item_type: string; p_item_id: string };
        Returns: undefined;
      };
      /**
       * 105 migration — dedupe ledger RPC: registers a view at most once
       * per viewer (auth uid when signed in, browser key otherwise) and
       * bumps view_count only for a first-time (item, viewer) pair.
       */
      register_item_view: {
        Args: {
          p_item_type: string;
          p_item_id: string;
          p_viewer_key: string;
        };
        /** true = this call actually counted a brand-new viewer. */
        Returns: boolean;
      };
    };
  };
}
