"use server";

import { createClient } from "@/lib/supabase/server";
import { foundItemSchema, lostItemSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { runMatchingForLostItem } from "@/lib/actions/matching";

export type ActionResult = { error?: string; itemId?: string };

export async function createLostItemAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report a lost item" };
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

  // Photos are required
  const attachedImages = formData.getAll("images") as File[];
  if (!attachedImages.some((f) => f && f.size > 0)) {
    return { error: "Please add at least one photo before submitting." };
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

  // Upload any attached images
  const images = formData.getAll("images") as File[];
  if (images.length > 0) {
    await uploadItemImagesAction("lost_item", inserted.id, images);
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to report a found item" };
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

  // Photos are required
  const attachedImages = formData.getAll("images") as File[];
  if (!attachedImages.some((f) => f && f.size > 0)) {
    return { error: "Please add at least one photo before submitting." };
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

  // Upload any attached images
  const images = formData.getAll("images") as File[];
  if (images.length > 0) {
    await uploadItemImagesAction("found_item", inserted.id, images);
  }

  revalidatePath("/found");
  return { itemId: inserted.id };
}

export async function markLostItemRecoveredAction(itemId: string): Promise<ActionResult> {
  const supabase = createClient();
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
  const supabase = createClient();
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

// --- Phase 4: Image Upload ---

export async function uploadItemImagesAction(
  itemType: "lost_item" | "found_item",
  itemId: string,
  images: File[]
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  // Verify ownership
  const tableName = itemType === "lost_item" ? "lost_items" : "found_items";
  const { data: item, error: itemError } = await supabase
    .from(tableName)
    .select("reporter_id")
    .eq("id", itemId)
    .single();

  if (itemError || !item || item.reporter_id !== user.id) {
    return { error: "Not authorized" };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 5 * 1024 * 1024; // 5 MB

  for (const file of images) {
    if (!validTypes.includes(file.type)) {
      return { error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" };
    }
    if (file.size > maxSize) {
      return { error: "Image must be smaller than 5 MB" };
    }
  }

  // Upload each image to the item_images bucket
  const uploads = [];
  for (const [index, file] of images.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `${itemType === "lost_item" ? "lost" : "found"}_${itemId}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload image" };
    }

    uploads.push({
      lost_item_id: itemType === "lost_item" ? itemId : null,
      found_item_id: itemType === "found_item" ? itemId : null,
      storage_path: fileName,
      position: index,
    });
  }

  const { error: insertError } = await supabase.from("item_images").insert(uploads);

  if (insertError) {
    console.error("Insert error:", insertError);
    return { error: "Failed to save image records" };
  }

  revalidatePath(`/lost/${itemId}`);
  revalidatePath(`/found/${itemId}`);
  return {};
}

// --- Phase 8: Saved Items ---

export async function saveItemAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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

// --- Phase 9: Report Flags ---

export async function reportFlagAction(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
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
    "inappropriate_content", "wrong_information", "other",
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
