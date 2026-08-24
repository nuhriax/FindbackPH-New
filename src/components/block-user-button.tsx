"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { blockUserAction, unblockUserAction } from "@/lib/actions/moderation";
import { useToast } from "@/components/ui/toast";
import { Ban, ShieldCheck } from "lucide-react";

/**
 * Block / unblock toggle for the message thread header. The initial state is
 * fetched client-side (RLS limits reads to the signed-in user's own blocks);
 * every change is re-validated by the server actions and RLS.
 */
export function BlockUserButton({ targetUserId }: { targetUserId: string }) {
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId)
        .limit(1);
      if (!cancelled) setBlocked((data?.length ?? 0) > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  function handleToggle() {
    const formData = new FormData();
    formData.set("blockedId", targetUserId);
    startTransition(async () => {
      const result = blocked ? await unblockUserAction(formData) : await blockUserAction(formData);
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      setBlocked(!blocked);
      toast(
        "success",
        blocked ? "User unblocked. They can message you again." : "User blocked. They can no longer message you.",
      );
    });
  }

  // Unknown yet — render nothing to avoid flashing the wrong state.
  if (blocked === null) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={blocked ? "Unblock this user" : "Block this user"}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {blocked ? (
        <>
          <ShieldCheck size={13} aria-hidden="true" />
          Unblock
        </>
      ) : (
        <>
          <Ban size={13} aria-hidden="true" />
          Block
        </>
      )}
    </button>
  );
}
