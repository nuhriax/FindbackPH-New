export type ItemStatus = "active" | "matched" | "recovered" | "archived" | "removed";
export type ItemCategory =
  | "phones" | "wallets" | "ids" | "bags" | "keys" | "jewelry"
  | "electronics" | "documents" | "clothing" | "pets" | "school_items" | "other";
export type UserRole = "user" | "moderator" | "admin";
export type ConversationItemType = "lost_item" | "found_item";
export type NotificationType = "new_message" | "possible_match" | "report_update" | "item_returned" | "moderation_action";
export type FlagReason = "scam" | "fake_report" | "harassment" | "suspicious_behavior" | "inappropriate_content" | "wrong_information" | "other";
export type FlagStatus = "pending" | "reviewed" | "dismissed";

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
  role: UserRole;
  successful_returns: number;
  is_suspended: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
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
  reward_amount: number | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
};

export type FoundItem = {
  id: string;
  reporter_id: string;
  title: string;
  category: ItemCategory;
  description: string;
  distinguishing_features: string | null;
  date_found: string;
  city: string;
  province: string;
  approximate_location: string | null;
  current_holding_info: string | null;
  status: ItemStatus;
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
        Update: Partial<LostItem>;
        Relationships: [];
      };
      found_items: {
        Row: FoundItem;
        Insert: Omit<FoundItem, "id" | "created_at" | "updated_at" | "status"> & { status?: ItemStatus };
        Update: Partial<FoundItem>;
        Relationships: [];
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
        Relationships: [];
      };
      saved_items: {
        Row: SavedItem;
        Insert: Omit<SavedItem, "id" | "created_at">;
        Update: Partial<SavedItem>;
        Relationships: [];
      };
      report_flags: {
        Row: ReportFlag;
        Insert: Omit<ReportFlag, "id" | "status" | "created_at" | "reviewed_at" | "reviewed_by">;
        Update: Partial<ReportFlag>;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string };
        Insert: Omit<{ id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string }, "id" | "created_at">;
        Update: Partial<{ id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; details: unknown | null; created_at: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
