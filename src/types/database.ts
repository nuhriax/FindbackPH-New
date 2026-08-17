export type ItemStatus = "active" | "matched" | "recovered" | "archived" | "removed";
export type ItemCategory =
  | "phones" | "wallets" | "ids" | "bags" | "keys" | "jewelry"
  | "electronics" | "documents" | "clothing" | "pets" | "school_items" | "other";
export type UserRole = "user" | "moderator" | "admin";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
