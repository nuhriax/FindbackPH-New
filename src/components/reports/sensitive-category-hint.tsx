"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

const SENSITIVE_CATEGORIES = new Set(["ids", "documents"]);

/**
 * Contextual privacy hint for sensitive report categories (IDs, documents).
 * Watches the category <select> and shows a calm reminder only when a
 * sensitive category is chosen — progressive disclosure, no permanent banner.
 */
export function SensitiveCategoryHint({ selectId }: { selectId: string }) {
  const [sensitive, setSensitive] = useState(false);

  useEffect(() => {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select) return;

    const update = () => setSensitive(SENSITIVE_CATEGORIES.has(select.value));
    update();
    select.addEventListener("change", update);
    return () => select.removeEventListener("change", update);
  }, [selectId]);

  if (!sensitive) return null;

  return (
    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50/80 px-3 py-2 text-xs leading-5 text-amber-800">
      <Lock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        This may contain sensitive personal information. Avoid publicly showing
        ID numbers, addresses, signatures, or other private details — say you
        have the document and verify ownership privately instead.
      </span>
    </p>
  );
}
