"use client";

import { useState, useTransition } from "react";
import { HelpCircle, Lock, Trash2 } from "lucide-react";
import {
  deleteOwnershipChallengeAction,
  saveOwnershipChallengeAction,
} from "@/lib/actions/ownership";
import {
  OWNERSHIP_HINTS,
  OWNERSHIP_QUESTION_EXAMPLES,
} from "@/lib/category-examples";
import type { ItemCategory } from "@/types/database";

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
  category,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  initialQuestion1?: string;
  initialQuestion2?: string;
  /** Item category — powers the category-aware example question & hints. */
  category?: ItemCategory | string | null;
}) {
  const [open, setOpen] = useState(false);
  const [q1, setQ1] = useState(initialQuestion1);
  const [a1, setA1] = useState("");
  const [q2, setQ2] = useState(initialQuestion2);
  const [a2, setA2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Category-aware examples: fall back to the generic "hidden detail" phrasing
  // whenever the category is unknown (e.g. older reports before the field).
  const suggestedQuestion =
    (category && OWNERSHIP_QUESTION_EXAMPLES[category as ItemCategory]) ||
    OWNERSHIP_QUESTION_EXAMPLES.other;
  const categoryHint =
    (category && OWNERSHIP_HINTS[category as ItemCategory]) ||
    OWNERSHIP_HINTS.other;

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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-electric-700"
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
        <li>• Ask something only the true owner knows {categoryHint}</li>
        <li>• Answers are hashed before storage and can never be read back — not even by you.</li>
        <li>• Claimants get 5 attempts; results are pass/fail only.</li>
      </ul>

      {/* Category-aware quick-fill: one tap inserts a strong question pattern
          for this item's category instead of leaving a blank text field. */}
      {suggestedQuestion && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Try:</span>
          <button
            type="button"
            onClick={() => {
              if (!q1.trim()) setQ1(suggestedQuestion);
              else if (!q2.trim()) setQ2(suggestedQuestion);
              else setQ1(suggestedQuestion);
            }}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-electric-300 hover:bg-electric-50 hover:text-electric-700"
          >
            {suggestedQuestion}
          </button>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <input
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
          placeholder={`Question 1 (e.g. ${suggestedQuestion})`}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
        />
        <input
          value={a1}
          onChange={(e) => setA1(e.target.value)}
          placeholder="Answer 1 (kept private)"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
        />

        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none">Optional second question</summary>
          <div className="mt-2 space-y-2">
            <input
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              placeholder="Question 2 (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
            />
            <input
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              placeholder="Answer 2 (kept private)"
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
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
          className="rounded-lg bg-sun-400 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-sun-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sun-500/35 disabled:opacity-50"
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
