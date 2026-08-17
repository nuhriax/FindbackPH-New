"use server";

import { createClient } from "@/lib/supabase/server";
import { foundItemSchema, lostItemSchema } from "@/lib/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | { error?: undefined };

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

  revalidatePath("/lost");
  redirect(`/lost/${inserted.id}`);
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

  revalidatePath("/found");
  redirect(`/found/${inserted.id}`);
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
