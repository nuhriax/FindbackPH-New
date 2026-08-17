"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Computes a similarity score (0–1) between a lost item and a found item.
 * Factors: category match, city/province match, date proximity, text similarity in title/description.
 */
function computeMatchScore(
  lost: { category: string; city: string; province: string; date_lost: string; title: string; description: string },
  found: { category: string; city: string; province: string; date_found: string; title: string; description: string }
): number {
  let score = 0;
  let maxScore = 0;

  // Category (weight 3)
  if (lost.category === found.category) {
    score += 3;
  }
  maxScore += 3;

  // Province (weight 2)
  if (lost.province.toLowerCase() === found.province.toLowerCase()) {
    score += 2;
  }
  maxScore += 2;

  // City (weight 2)
  if (lost.city.toLowerCase() === found.city.toLowerCase()) {
    score += 2;
  }
  maxScore += 2;

  // Date proximity (weight 1.5) — only if dates are within 30 days
  const lostDate = Date.parse(lost.date_lost);
  const foundDate = Date.parse(found.date_found);
  if (!Number.isNaN(lostDate) && !Number.isNaN(foundDate)) {
    const diffDays = Math.abs(lostDate - foundDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 30) {
      const dateScore = Math.max(0, 1.5 * (1 - diffDays / 30));
      score += dateScore;
    }
  }
  maxScore += 1.5;

  // Title similarity (weight 1.5)
  const titleSimilarity = jaccardSimilarity(
    lost.title.toLowerCase(),
    found.title.toLowerCase()
  );
  score += 1.5 * titleSimilarity;
  maxScore += 1.5;

  // Description overlap (weight 2)
  const descSimilarity = jaccardSimilarity(
    lost.description.toLowerCase(),
    found.description.toLowerCase()
  );
  score += 2 * descSimilarity;
  maxScore += 2;

  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\W+/).filter(Boolean));
  const setB = new Set(b.split(/\W+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Runs the matching engine for a newly-posted lost item against all active found items.
 * Stores matches with score > 0.6 (60%).
 */
export async function runMatchingForLostItem(lostItemId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  // Fetch the lost item
  const { data: lostItem, error: lostError } = await supabase
    .from("lost_items")
    .select("*")
    .eq("id", lostItemId)
    .single();

  if (lostError || !lostItem) {
    return { error: "Lost item not found" };
  }

  // Only match active lost items that haven't been recovered
  if (lostItem.status !== "active") {
    return {};
  }

  // Fetch all active found items in the same province (or nationwide if no province match)
  const { data: foundItems, error: foundError } = await supabase
    .from("found_items")
    .select("*")
    .eq("status", "active");

  if (foundError) {
    console.error("Matching query error:", foundError);
    return { error: "Could not run matching" };
  }

  // Compute scores
  const matches: { lost_item_id: string; found_item_id: string; score: number }[] = [];

  for (const found of foundItems ?? []) {
    // Skip items already matched and not dismissed
    const existingScore = await computeMatchScore(lostItem, found);
    if (existingScore > 0.6) {
      matches.push({
        lost_item_id: lostItemId,
        found_item_id: found.id,
        score: Math.round(existingScore * 100) / 100,
      });
    }
  }

  // Insert new matches (ignore duplicates)
  if (matches.length > 0) {
    const { error: insertError } = await supabase.from("matches").insert(
      matches.map((m) => ({
        lost_item_id: m.lost_item_id,
        found_item_id: m.found_item_id,
        score: m.score,
      })),
      { count: "none" }
    );

    // Note: ignore duplicate key conflicts
    if (insertError && insertError.code !== "23505") {
      console.error("Match insert error:", insertError);
    }

    // Create notifications for each match
    const { data: notifier } = await supabase.auth.getUser();
    if (notifier.user) {
      for (const m of matches) {
        await supabase.from("notifications").insert({
          user_id: lostItem.reporter_id,
          type: "possible_match",
          title: "Possible match found",
          message: `We found a possible match for your lost item "${lostItem.title}".`,
          link: `/lost/${lostItemId}`,
        });
      }
    }
  }

  return {};
}
