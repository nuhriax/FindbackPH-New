"use client";

import { useState, useTransition } from "react";
import { HelpCircle, Lock, Trash2 } from "lucide-react";
import {
  deleteOwnershipChallengeAction,
  saveOwnershipChallengeAction,
} from "@/lib/actions/ownership";

/**
 * Owner-side control for the private ownership challenge (Phase 7).
 *
 * The questions are intentionally PERSONAL and never displayed publicly beyond
 * this report page; the ANSWERS themselves are hashed with SHA-256 in a server
 * action before storage, so even the database only ever holds digests.
 */
export function OwnershipChallengeManager({
  itemType,
  itemId,
  initialQuestion1 = "",
  initialQuestion2 = "",
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  initialQuestion1?: string;
  initialQuestion2?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q1, setQ1] = useState(initialQuestion1);
  const [a1, setA1] = useState("");
  const [q2, setQ2] = useState(initialQuestion2);
  const [a2, setA2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveOwnershipChallengeAction(itemType, itemId, q1, a1, q2, a2);
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setA1("");
        setA2("");
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteOwnershipChallengeAction(itemType, itemId);
      if (res.error) setError(res.error);
    });
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-700"
        >
          <Lock size={13} />
          Ownership verification
        </button>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {initialQuestion1
            ? "You have verification questions on this report."
            : "Add private questions so finders can prove the item is really yours."}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Lock size={14} className="text-slate-500" />
        <h4 className="text-sm font-bold text-slate-900">Ownership verification</h4>
      </div>

      <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
        <li>• Ask something only the true owner knows (wallpaper, case, sticker, contents…).</li>
        <li>• Answers are hashed before storage and can never be read back — not even by you.</li>
        <li>• Claimants get 5 attempts; results are pass/fail only.</li>
      </ul>

      <div className="mt-3 space-y-3">
        <input
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
          placeholder="Question 1 (e.g. What wallpaper is on the phone?)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <input
          value={a1}
          onChange={(e) => setA1(e.target.value)}
          placeholder="Answer 1 (kept private)"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none">Optional second question</summary>
          <div className="mt-2 space-y-2">
            <input
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Question 2 (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              placeholder="Answer 2 (kept private)"
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </details>
      </div>

      {saved && !error && (
        <p role="status" className="mt-2 text-xs font-medium text-emerald-700">
          Verification questions saved.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={save}
          disabled={pending || a1.trim().length === 0 || q1.trim().length === 0}
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save questions"}
        </button>
        {initialQuestion1 && (
          <button
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-slate-400">
          <HelpCircle size={11} /> Stored as SHA-256 hashes
        </span>
      </div>
    </div>
  );
}
