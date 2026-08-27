"use server";

import { createClient } from "@/lib/supabase/server";
import { foundItemSchema, lostItemSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { consumeRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { runMatchingForLostItem, runMatchingForFoundItem } from "@/lib/actions/matching";

export type ActionResult = { error?: string; itemId?: string };

/**
 * Anti-spam: a short cooldown between reports per user. Checks the timestamp of
 * the user's most recent report (lost OR found) and blocks a new one until the
 * window has passed. Server-side only — clients can't bypass it.
 */
const REPORT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

async function reportCooldownMsRemaining(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  let latest = 0;
  for (const table of ["lost_items", "found_items"] as const) {
    const { data } = await supabase
      .from(table)
      .select("created_at")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    const ts = data?.[0]?.created_at as string | undefined;
    if (ts) latest = Math.max(latest, new Date(ts).getTime());
  }
  return Math.max(0, REPORT_COOLDOWN_MS - (Date.now() - latest));
}

export async function createLostItemAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report a lost item" };
  }

  const rl = await consumeRateLimit("report", 10, 5 * 60 * 1000);
  if (!rl.ok) return { error: RATE_LIMIT_MESSAGE };

  const cooldown = await reportCooldownMsRemaining(supabase, user.id);
  if (cooldown > 0) {
    return { error: "Please wait a moment before posting another report." };
  }

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    distinguishingFeatures: formData.get("distinguishingFeatures")?.toString() || undefined,
    dateLost: formData.get("dateLost")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    province: formData.get("province")?.toString() ?? "",
    approximateLocation: formData.get("approximateLocation")?.toString() || undefined,
    rewardAmount: formData.get("rewardAmount")?.toString() || undefined,
  };

  const parsed = lostItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: inserted, error } = await supabase
    .from("lost_items")
    .insert({
      reporter_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      distinguishing_features: parsed.data.distinguishingFeatures ?? null,
      date_lost: parsed.data.dateLost,
      city: parsed.data.city,
      province: parsed.data.province,
      approximate_location: parsed.data.approximateLocation ?? null,
      reward_amount: parsed.data.rewardAmount ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "We couldn't save your report. Please try again." };
  }

  // Run the matching engine against active found reports
  try {
    await runMatchingForLostItem(inserted.id);
  } catch (e) {
    console.error("Matching engine error:", e);
  }

  revalidatePath("/lost");
  return { itemId: inserted.id };
}

export async function createFoundItemAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report a found item" };
  }

  const rl = await consumeRateLimit("report", 10, 5 * 60 * 1000);
  if (!rl.ok) return { error: RATE_LIMIT_MESSAGE };

  const cooldown = await reportCooldownMsRemaining(supabase, user.id);
  if (cooldown > 0) {
    return { error: "Please wait a moment before posting another report." };
  }

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    distinguishingFeatures: formData.get("distinguishingFeatures")?.toString() || undefined,
    dateFound: formData.get("dateFound")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    province: formData.get("province")?.toString() ?? "",
    approximateLocation: formData.get("approximateLocation")?.toString() || undefined,
    currentHoldingInfo: formData.get("currentHoldingInfo")?.toString() || undefined,
  };

  const parsed = foundItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: inserted, error } = await supabase
    .from("found_items")
    .insert({
      reporter_id: user.id,
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      distinguishing_features: parsed.data.distinguishingFeatures ?? null,
      date_found: parsed.data.dateFound,
      city: parsed.data.city,
      province: parsed.data.province,
      approximate_location: parsed.data.approximateLocation ?? null,
      current_holding_info: parsed.data.currentHoldingInfo ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "We couldn't save your report. Please try again." };
  }

  // Reverse matching: check this new found item against existing active lost
  // reports so their owners discover it (best-effort; never blocks the report).
  try {
    await runMatchingForFoundItem(inserted.id);
  } catch (e) {
    console.error("Reverse matching engine error:", e);
  }

  revalidatePath("/found");
  return { itemId: inserted.id };
}

export async function markLostItemRecoveredAction(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  // RLS also enforces reporter_id = auth.uid(); this check gives a clean error message.
  const { error } = await supabase
    .from("lost_items")
    .update({ status: "recovered" })
    .eq("id", itemId)
    .eq("reporter_id", user.id);

  if (error) return { error: "Couldn't update this report" };

  revalidatePath("/dashboard");
  revalidatePath(`/lost/${itemId}`);
  return {};
}

export async function deleteLostItemAction(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const { error } = await supabase
    .from("lost_items")
    .delete()
    .eq("id", itemId)
    .eq("reporter_id", user.id);

  if (error) return { error: "Couldn't delete this report" };

    revalidatePath("/dashboard");
  revalidatePath("/lost");
  return {};
}

// --- Phase 4b: Remove Item Image ---

/**
 * Removes one photo from the signed-in user's own report: deletes the Storage
 * object and the matching `item_images` row. Ownership is verified against the
 * parent report before anything is deleted (RLS enforces this again in
 * Postgres).
 */
export async function removeItemImageAction(
  imageId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };
  if (!imageId) return { error: "Missing photo" };

  const { data: img, error: imgError } = await supabase
    .from("item_images")
    .select("id, storage_path, lost_item_id, found_item_id")
    .eq("id", imageId)
    .single();

  if (imgError || !img) {
    return { error: "That photo no longer exists." };
  }

  const itemId = img.lost_item_id ?? img.found_item_id;
  if (!itemId) {
    return { error: "That photo no longer exists." };
  }
  const tableName = img.lost_item_id ? "lost_items" : "found_items";

  // Ownership: only the report's reporter can remove its photos.
  const { data: item } = await supabase
    .from(tableName)
    .select("reporter_id")
    .eq("id", itemId)
    .single();

  if (!item || item.reporter_id !== user.id) {
    return { error: "You can only remove photos from your own reports." };
  }

  // Best-effort storage cleanup; the DB row is the source of truth for display.
  await supabase.storage.from("item-images").remove([img.storage_path]);

  const { error: delError } = await supabase
    .from("item_images")
    .delete()
    .eq("id", imageId);

  if (delError) {
    console.error("Item image delete error:", delError);
    return { error: "Couldn't remove that photo. Please try again." };
  }

  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  revalidatePath("/lost");
  revalidatePath("/found");
  return {};
}

// --- Phase 8: Saved Items ---

export async function saveItemAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to save items" };
  }

  const lostItemId = formData.get("lostItemId")?.toString() || null;
  const foundItemId = formData.get("foundItemId")?.toString() || null;

  if (!lostItemId && !foundItemId) {
    return { error: "No item specified" };
  }

  const { error } = await supabase.from("saved_items").insert({
    user_id: user.id,
    lost_item_id: lostItemId,
    found_item_id: foundItemId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Item is already saved" };
    }
    return { error: "Could not save this item" };
  }

  return {};
}

export async function unsaveItemAction(formData: FormData): Promise<ActionResult> {
  const savedItemId = formData.get("savedItemId")?.toString() ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  if (!savedItemId) {
    return { error: "Missing saved item id" };
  }

  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("id", savedItemId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Could not remove saved item" };
  }

  return {};
}

export async function getUserSavedItems(userId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetId = userId ?? user?.id;
  if (!targetId) return [];

  const { data, error } = await supabase
    .from("saved_items")
    .select(`
      *,
      lost_items(*),
      found_items(*)
    `)
    .eq("user_id", targetId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved items:", error);
    return [];
  }

  return data ?? [];
}

/** Total number of reports the current user has saved (for a navbar badge). */
export async function getSavedItemsCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("saved_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error counting saved items:", error);
    return 0;
  }

  return count ?? 0;
}

export type SavedItemPreview = {
  id: string;
  /** Detail-page path for the saved report. */
  href: string;
  title: string;
  status: string;
  category: string | null;
  city: string | null;
  province: string | null;
  is_lost: boolean;
  created_at: string;
};

/**
 * Compact summaries of the most recently saved reports for the navbar's
 * Messenger-style dropdown.
 */
export async function getSavedItemPreviews(limit = 5): Promise<SavedItemPreview[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_items")
    .select(
      `id, created_at, lost_item_id, found_item_id,
       lost_items(title, status, category, city, province),
       found_items(title, status, category, city, province)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching saved item previews:", error);
    return [];
  }

  type PreviewRow = {
    id: string;
    created_at: string;
    lost_item_id: string | null;
    found_item_id: string | null;
    lost_items?: Array<{ title: string; status: string; category: string; city: string; province: string }> | null;
    found_items?: Array<{ title: string; status: string; category: string; city: string; province: string }> | null;
  };

  return (data as unknown as PreviewRow[]).map((row) => {
    // Many-to-one embeds resolve to single-object arrays under postgrest-js v2.
    const lost = row.lost_items?.[0];
    const found = row.found_items?.[0];
    const item = lost ?? found ?? null;
    const isLost = !!lost;

    return {
      id: row.id,
      href: isLost ? `/lost/${row.lost_item_id}` : `/found/${row.found_item_id}`,
      title: item?.title ?? "Unknown item",
      status: item?.status ?? "active",
      category: item?.category ?? null,
      city: item?.city ?? null,
      province: item?.province ?? null,
      is_lost: isLost,
      created_at: row.created_at,
    };
  });
}

// --- Phase 9: Report Flags ---

export async function reportFlagAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report" };
  }

  const itemType = formData.get("itemType")?.toString() ?? "";
  const itemId = formData.get("itemId")?.toString() ?? "";
  const reason = formData.get("reason")?.toString() ?? "";
  const details = formData.get("details")?.toString() || null;

  if (!["lost_item", "found_item"].includes(itemType)) {
    return { error: "Invalid item type" };
  }

  const validReasons = [
    "scam", "fake_report", "harassment", "suspicious_behavior",
    "inappropriate_content", "wrong_information", "impersonation", "other",
  ];

  if (!validReasons.includes(reason)) {
    return { error: "Invalid report reason" };
  }

  const { error } = await supabase.from("report_flags").insert({
    item_type: itemType as "lost_item" | "found_item",
    item_id: itemId,
    reporter_id: user.id,
    reason: reason as any,
    details,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already reported this item" };
    }
    return { error: "Could not submit your report" };
  }

  return {};
}
