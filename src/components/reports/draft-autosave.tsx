"use client";

import { useEffect } from "react";

/**
 * Draft autosave for the multi-step report wizard.
 *
 * Serializes every named field in the form to localStorage (debounced) as the
 * user types, restores the draft on mount, and clears it when `active`
 * flips to false (i.e. the report was successfully submitted). Losing four
 * steps of typing to a phone-browser reload is the #1 wizard abandonment
 * cause, so this quietly has the user's back.
 *
 * Files are intentionally NOT persisted — only text/select values.
 */
export function DraftAutoSave({
  formId,
  storageKey,
  active,
}: {
  formId: string;
  storageKey: string;
  /** false once the report is submitted — clears the stored draft. */
  active: boolean;
}) {
  // Restore on mount (only fills empty fields so it never clobbers defaults).
  useEffect(() => {
    if (!active) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, string>;
      const form = document.getElementById(formId);
      if (!(form instanceof HTMLFormElement)) return;
      for (const el of Array.from(form.elements)) {
        const field = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (!field.name || field.type === "file" || field.type === "hidden") continue;
        const value = draft[field.name];
        if (typeof value === "string" && value && !field.value) {
          field.value = value;
        }
      }
    } catch {
      /* corrupted draft — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on input (debounced).
  useEffect(() => {
    if (!active) return;
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onInput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const draft: Record<string, string> = {};
          for (const el of Array.from(form.elements)) {
            const field = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            if (!field.name || field.type === "file" || field.type === "hidden") continue;
            if (field instanceof HTMLInputElement && field.type === "checkbox") {
              if (field.checked) draft[field.name] = field.value;
            } else {
              draft[field.name] = field.value;
            }
          }
          window.localStorage.setItem(storageKey, JSON.stringify(draft));
        } catch {
          /* quota or private mode — best effort */
        }
      }, 400);
    };

    form.addEventListener("input", onInput);
    return () => {
      form.removeEventListener("input", onInput);
      clearTimeout(timer);
    };
  }, [formId, storageKey, active]);

  // Clear the draft once the report went through.
  useEffect(() => {
    if (active) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [active, storageKey]);

  return null;
}
