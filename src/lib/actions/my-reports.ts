"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { lostItemSchema, foundItemSchema, type LostItemInput, type FoundItemInput } from "@/lib/validation";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Edits one of the signed-in user's own reports. Ownership is enforced with
 * `.eq("reporter_id", user.id)` in the update itself — a stale or forged id
 * simply updates nothing, and RLS re-checks the same constraint in Postgres.
 */
export async function updateReportAction(formData: FormData): Promise<ActionResult> {
  const kind = formData.get("kind")?.toString();
  if (kind !== "lost_item" && kind !== "found_item") {
    return { error: "Invalid report type" };
  }
  const id = formData.get("id")?.toString() ?? "";
  if (!id) return { error: "Missing report id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in" };

  const isLost = kind === "lost_item";
  const table = isLost ? "lost_items" : "found_items";

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    distinguishingFeatures: formData.get("distinguishingFeatures")?.toString() || undefined,
    city: formData.get("city")?.toString() ?? "",
    province: formData.get("province")?.toString() ?? "",
    approximateLocation: formData.get("approximateLocation")?.toString() || undefined,
    ...(isLost
      ? { dateLost: formData.get("dateLost")?.toString() ?? "" }
      : { dateFound: formData.get("dateFound")?.toString() ?? "" }),
    ...(isLost
      ? { rewardAmount: formData.get("rewardAmount")?.toString() || undefined }
      : { currentHoldingInfo: formData.get("currentHoldingInfo")?.toString() || undefined }),
  };

  const parsed = (isLost ? lostItemSchema : foundItemSchema).safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data as LostItemInput & FoundItemInput;

  const updateData = isLost
    ? {
        title: d.title,
        category: d.category,
        description: d.description,
        distinguishing_features: d.distinguishingFeatures ?? null,
        date_lost: d.dateLost,
        city: d.city,
        province: d.province,
        approximate_location: d.approximateLocation ?? null,
        reward_amount: d.rewardAmount ?? null,
      }
    : {
        title: d.title,
        category: d.category,
        description: d.description,
        distinguishing_features: d.distinguishingFeatures ?? null,
        date_found: d.dateFound,
        city: d.city,
        province: d.province,
        approximate_location: d.approximateLocation ?? null,
        current_holding_info: d.currentHoldingInfo ?? null,
      };

  const { error } = await supabase.from(table).update(updateData).eq("id", id).eq("reporter_id", user.id);

  if (error) {
    console.error("Report update error:", error);
    return { error: "Couldn't update this report. Please try again." };
  }

  revalidatePath("/search");
  revalidatePath(`/search/${id}`);
  revalidatePath(`/dashboard/reports`);
  return {};
}

/**
 * Notifies every other participant in conversations about an item when the
 * owner marks it as returned, so people who reached out get a real update.
 */
async function notifyReturnedParticipants(itemType: "lost_item" | "found_item", itemId: string, ownerId: string) {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("participant_a, participant_b")
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (!conversations || conversations.length === 0) return;

  const targets = new Set<string>();
  for (const c of conversations) {
    for (const id of [c.participant_a, c.participant_b]) {
      if (id && id !== ownerId) targets.add(id);
    }
  }

  if (targets.size === 0) return;

  for (const userId of targets) {
    // Dedupe-safe insert: participants who were already told this report is
    // returned (and haven't read it yet) are not notified again.
    await supabase.rpc("notify_user_once", {
      p_user_id: userId,
      p_type: "item_returned",
      p_title: "A report you contacted was marked as returned",
      p_message:
        "The person you reached out to has marked this report as returned. You can review the report for reference.",
      p_link: `/search/${itemId}`,
    });
  }
}

/**
 * Lets the signed-in user change the status of one of THEIR OWN reports.
 * Ownership is enforced with `.eq("reporter_id", user.id)` — a client could
 * never target another user's report. RLS enforces this again at the DB level.
 */
export async function setMyReportStatusAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  status: "recovered" | "archived" | "active"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in" };

  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";

  const { error } = await supabase
    .from(tableName)
    .update({ status })
    .eq("id", itemId)
    .eq("reporter_id", user.id);

  if (error) {
    console.error("Status update error:", error);
    return { error: "Couldn't update this report" };
  }

  if (status === "recovered") {
    await notifyReturnedParticipants(itemType, itemId, user.id);
  }

  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  revalidatePath(`/search/${itemId}`);
  revalidatePath(`/search`);
  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  return {};
}