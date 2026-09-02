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
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  function performBlock() {
    const formData = new FormData();
    formData.set("blockedId", targetUserId);
    startTransition(async () => {
      const result = blocked ? await unblockUserAction(formData) : await blockUserAction(formData);
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      setBlocked(!blocked);
      setConfirmOpen(false);
      toast(
        "success",
        blocked ? "User unblocked. They can message you again." : "User blocked. They can no longer message you.",
      );
    });
  }

  function handleToggle() {
    // Blocking is disruptive and easy to do by accident — confirm first.
    if (blocked) {
      performBlock();
    } else {
      setConfirmOpen(true);
    }
  }

  // Unknown yet — render nothing to avoid flashing the wrong state.
  if (blocked === null) return null;

  return (
    <>
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

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setConfirmOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Block this user"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-card border border-slate-200/70 bg-white p-6 shadow-soft fade-in"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Ban size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-navy-900">Block this user?</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to block this person? They will no longer be able to message you. You can
                  unblock them anytime.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="button" onClick={performBlock} disabled={isPending} className="btn-destructive">
                {isPending ? "Blocking…" : "Yes, block this person"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
