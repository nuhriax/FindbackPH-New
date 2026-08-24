"use server";

import { createClient } from "@/lib/supabase/server";
import { computeMatchScore, MATCH_THRESHOLD } from "@/lib/matching-score";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Runs the matching engine for a newly-posted found item against all active
 * lost items. This is the reverse direction of `runMatchingForLostItem`: a
 * lost report created earlier should still discover items found later.
 */
export async function runMatchingForFoundItem(foundItemId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in" };
  }

  // Fetch the found item
  const { data: foundItem, error: foundError } = await supabase
    .from("found_items")
    .select("*")
    .eq("id", foundItemId)
    .single();

  if (foundError || !foundItem) {
    return { error: "Found item not found" };
  }

  if (foundItem.status !== "active") {
    return {};
  }

  if (foundItem.reporter_id !== user.id) {
    return { error: "You can only run matching for your own reports" };
  }

  // Only match against active lost reports that haven't been recovered.
  // Bounded so a large table never loads fully into memory.
  const { data: lostItems, error: lostError } = await supabase
    .from("lost_items")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(500);

  if (lostError) {
    console.error("Reverse matching query error:", lostError);
    return { error: "Could not run matching" };
  }

  const matches: { lost_item_id: string; found_item_id: string; score: number }[] = [];

  for (const lost of lostItems ?? []) {
    const score = computeMatchScore(lost, foundItem);
    if (score > MATCH_THRESHOLD) {
      matches.push({
        lost_item_id: lost.id,
        found_item_id: foundItemId,
        score: Math.round(score * 100) / 100,
      });
    }
  }

  if (matches.length > 0) {
    // Duplicate protection (server level): figure out which matches are
    // genuinely NEW before upserting, so notifications only fire when a match
    // row is actually created — never on repeat runs of the engine.
    const { data: existingRows } = await supabase
      .from("matches")
      .select("lost_item_id")
      .in(
        "lost_item_id",
        matches.map((m) => m.lost_item_id),
      )
      .eq("found_item_id", foundItemId);

    const alreadyMatched = new Set((existingRows ?? []).map((r) => r.lost_item_id));
    const newMatches = matches.filter((m) => !alreadyMatched.has(m.lost_item_id));

    // Insert new matches, skipping ones that already exist (unique constraint).
    const { error: insertError } = await supabase.from("matches").upsert(
      matches.map((m) => ({
        lost_item_id: m.lost_item_id,
        found_item_id: m.found_item_id,
        score: m.score,
      })),
      { onConflict: "lost_item_id,found_item_id", ignoreDuplicates: true },
    );

    if (insertError && insertError.code !== "23505") {
      console.error("Match insert error:", insertError);
    }

    // One notification per affected lost-report owner (not per match), and
    // only when that owner gained at least one genuinely new match. The
    // `notify_user_once` RPC re-checks for duplicates at the DB level.
    if (newMatches.length > 0) {
      const linkByOwner = new Map<string, string>();
      for (const m of newMatches) {
        const lost = (lostItems ?? []).find((l) => l.id === m.lost_item_id);
        if (lost && !linkByOwner.has(lost.reporter_id)) {
          linkByOwner.set(lost.reporter_id, `/lost/${lost.id}`);
        }
      }

      for (const [ownerId, link] of linkByOwner) {
        await supabase.rpc("notify_user_once", {
          p_user_id: ownerId,
          p_type: "possible_match",
          p_title: "Possible match found",
          p_message: `A newly reported found item may match your lost item "${foundItem.title}".`,
          p_link: link,
        });
      }
    }
  }

  return {};
}

/**
 * Runs the matching engine for a newly-posted lost item against all active found items.
 * Stores matches with score above the threshold.
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

  if (lostItem.reporter_id !== user.id) {
    return { error: "You can only run matching for your own reports" };
  }

  // Fetch recent active found items to compare against.
  // Bounded so a large table never loads fully into memory.
  const { data: foundItems, error: foundError } = await supabase
    .from("found_items")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(500);

  if (foundError) {
    console.error("Matching query error:", foundError);
    return { error: "Could not run matching" };
  }

  // Compute scores
  const matches: { lost_item_id: string; found_item_id: string; score: number }[] = [];

  for (const found of foundItems ?? []) {
    const existingScore = computeMatchScore(lostItem, found);
    if (existingScore > MATCH_THRESHOLD) {
      matches.push({
        lost_item_id: lostItemId,
        found_item_id: found.id,
        score: Math.round(existingScore * 100) / 100,
      });
    }
  }

  // Insert new matches, skipping duplicates via the unique constraint.
  if (matches.length > 0) {
    // Duplicate protection (server level): only genuinely NEW matches count as
    // news. Repeat engine runs must never re-notify the reporter.
    const { data: existingRows } = await supabase
      .from("matches")
      .select("found_item_id")
      .eq("lost_item_id", lostItemId)
      .in(
        "found_item_id",
        matches.map((m) => m.found_item_id),
      );

    const alreadyMatched = new Set((existingRows ?? []).map((r) => r.found_item_id));
    const newMatches = matches.filter((m) => !alreadyMatched.has(m.found_item_id));

    const { error: insertError } = await supabase.from("matches").upsert(
      matches.map((m) => ({
        lost_item_id: m.lost_item_id,
        found_item_id: m.found_item_id,
        score: m.score,
      })),
      { onConflict: "lost_item_id,found_item_id", ignoreDuplicates: true },
    );

    if (insertError && insertError.code !== "23505") {
      console.error("Match insert error:", insertError);
    }

    // One notification per run (not one per match), only when new matches were
    // actually created. `notify_user_once` re-checks duplicates at the DB level.
    if (newMatches.length > 0) {
      await supabase.rpc("notify_user_once", {
        p_user_id: lostItem.reporter_id,
        p_type: "possible_match",
        p_title: "Possible match found",
        p_message: `We found ${newMatches.length} possible match${newMatches.length > 1 ? "es" : ""} for your lost item "${lostItem.title}".`,
        p_link: `/lost/${lostItemId}`,
      });
    }
  }

  return {};
}
