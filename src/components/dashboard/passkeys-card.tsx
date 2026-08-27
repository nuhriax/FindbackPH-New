"use client";

/**
 * Security → Passkeys management card for the settings page.
 *
 * SECURITY:
 * - Gated by the NEXT_PUBLIC_PASSKEYS_ENABLED kill switch; renders nothing
 *   when the variable is absent (fail-safe OFF).
 * - Only the signed-in user's own passkeys are touched — every call goes to
 *   Supabase Auth with the user's own session cookie; no service-role key is
 *   involved anywhere.
 * - Enrollment requires an existing session (this card only appears inside
 *   /dashboard/settings, which middleware already protects), and Supabase Auth
 *   itself enforces challenge/verification server-side. No custom crypto here.
 */
import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Plus, Save, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { enforcePasskeyRateLimit } from "@/lib/actions/passkeys";
import {
  PASSKEYS_ENABLED,
  describePasskeyError,
  isValidPasskeyName,
  webAuthnSupported,
} from "@/lib/passkeys";
import { cn } from "@/lib/utils";

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function PasskeysCard() {
  const [available, setAvailable] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // id of the passkey currently being renamed + its draft value
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      setPasskeys((data as unknown as { data?: PasskeyItem[] })?.data ?? []);
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (!PASSKEYS_ENABLED || !webAuthnSupported()) {
      setAvailable(false);
      setLoadingList(false);
      return;
    }
    setAvailable(true);
    void refresh();
  }, [refresh]);

  if (!available) return null;

  async function handleEnroll() {
    if (enrolling) return;
    setError(null);
    setMessage(null);
    setEnrolling(true);
    try {
      // Server-side abuse gate before starting a WebAuthn ceremony.
      const limit = await enforcePasskeyRateLimit();
      if (!limit.ok) {
        setError(limit.message ?? "Too many attempts. Please try again later.");
        setEnrolling(false);
        return;
      }
      const supabase = createClient();
      // High-level SDK call: fetches options, runs navigator.credentials.create()
      // internally, and verifies the credential with Supabase Auth server-side.
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      await refresh();
      setMessage("Passkey registered.");
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setEnrolling(false);
    }
  }

  async function handleDelete(id: string) {
    if (busyId) return;
    setError(null);
    setMessage(null);
    setBusyId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
      if (error) throw error;
      await refresh();
      setMessage("Passkey removed.");
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setBusyId(null);
    }
  }

  function startRename(pk: PasskeyItem) {
    setError(null);
    setMessage(null);
    setRenamingId(pk.id);
    setRenameValue(pk.friendly_name ?? "");
  }

  async function saveRename() {
    if (!renamingId || busyId) return;
    const name = renameValue.trim();
    if (!isValidPasskeyName(name)) {
      setError("Please use a name between 1 and 120 characters.");
      return;
    }
    setBusyId(renamingId);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.passkey.update({
        passkeyId: renamingId,
        friendlyName: name,
      });
      if (error) throw error;
      setRenamingId(null);
      await refresh();
      setMessage("Passkey renamed.");
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-navy-700" aria-hidden />
            <h2 className="font-display text-lg font-semibold text-navy-900">Passkeys</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Sign in instantly with your fingerprint, face, or device PIN instead of a password.
            Passkeys stay on your device and are phishing-resistant.
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrolling || busyId !== null}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {enrolling ? "Registering…" : "Add passkey"}
        </button>
      </div>

      {(message || error) && (
        <p
          role="status"
          className={cn(
            "mt-4 rounded-xl px-3 py-2 text-sm",
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          )}
        >
          {error ?? message}
        </p>
      )}

      <div className="mt-4 divide-y divide-slate-100">
        {loadingList ? (
          <p className="py-3 text-sm text-slate-500">Loading your passkeys…</p>
        ) : passkeys.length === 0 ? (
          <p className="py-3 text-sm text-slate-500">
            No passkeys registered yet. Add one to sign in without your password.
          </p>
        ) : (
          passkeys.map((pk) => (
            <div key={pk.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy-900">
                  {pk.friendly_name || "Unnamed passkey"}
                </p>
                <p className="text-xs text-slate-400">
                  Added{" "}
                  {new Date(pk.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {pk.last_used_at
                    ? ` · last used ${new Date(pk.last_used_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {renamingId === pk.id ? (
                  <>
                    <input
                      value={renameValue}
                      maxLength={120}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      aria-label="New passkey name"
                      className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-navy-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void saveRename()}
                      disabled={busyId !== null}
                      title="Save name"
                      className="rounded-lg p-2 text-navy-700 hover:bg-navy-50 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      title="Cancel"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startRename(pk)}
                      disabled={busyId !== null}
                      title="Rename passkey"
                      className="rounded-lg px-2 py-1 text-sm font-medium text-navy-700 hover:bg-navy-50 disabled:opacity-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pk.id)}
                      disabled={busyId !== null}
                      title="Remove passkey"
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Lost the device a passkey lives on? You can always sign in with your password or Google /
        Facebook, then remove the missing passkey here.
      </p>
    </div>
  );
}

