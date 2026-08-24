"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { submitOwnershipAnswersAction } from "@/lib/actions/ownership";

/**
 * Claimant-side form for the private ownership challenge (Phase 7).
 * Shows the owner's questions only; the submitted answers are compared
 * INSIDE Postgres via a security-definer RPC and this component only ever
 * receives pass/fail — never the stored hashes.
 */
export function OwnershipChallengeForm({
  itemType,
  itemId,
  question1,
  question2,
  hasSecondQuestion,
}: {
  itemType: "lost_item" | "found_item";
  itemId: string;
  question1: string;
  question2: string | null;
  hasSecondQuestion: boolean;
}) {
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (passed) return null;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitOwnershipAnswersAction(itemType, itemId, a1, a2);
      if (res.passed) {
        setPassed(true);
      } else {
        setError(
          res.error === "too_many_attempts"
            ? "Too many incorrect attempts. Contact the reporter through messages instead."
            : res.error === "mismatch" || !res.error
              ? "That doesn't match. Please check your answers and try again."
              : "Verification failed. Please try again."
        );
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <KeyRound size={14} className="text-slate-500" />
        <h4 className="text-sm font-bold text-slate-900">Prove it&apos;s yours</h4>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        The reporter added private verification questions. Answer correctly to show
        them you know the item. Answers are checked privately — they are never shown
        publicly.
      </p>

      <div className="mt-3 space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-700">{question1}</span>
          <input
            value={a1}
            onChange={(e) => setA1(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        {hasSecondQuestion && question2 && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">{question2}</span>
            <input
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={pending || a1.trim().length === 0}
        className="mt-3 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Submit answers"}
      </button>
    </div>
  );
}
