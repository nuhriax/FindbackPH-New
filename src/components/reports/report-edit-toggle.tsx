"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, X } from "lucide-react";
import { EditReportForm, type EditableReport, type EditPhoto } from "@/components/reports/edit-report-form";

/**
 * Inline report editor toggle.
 *
 * Renders an "Edit Report" button that expands the edit form DIRECTLY on the
 * report page (no navigation). Saving refreshes the page's server data and
 * collapses the editor, keeping the user exactly where they are.
 *
 * `children` (optional) is rendered next to the toggle button — the report
 * page passes the owner actions (mark returned / archive) so they stay in the
 * same action row.
 */
export function ReportEditToggle({
  kind,
  item,
  images = [],
  children,
}: {
  kind: "lost_item" | "found_item";
  item: EditableReport;
  /** Photos currently stored on the report — removable inside the editor. */
  images?: EditPhoto[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSaved() {
    // Re-render the server components on this page so the report details
    // reflect the saved changes, then collapse the editor.
    router.refresh();
    setOpen(false);
    // Bring the updated report header back into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const toggleBtnClass = `
            inline-flex
            flex-1
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            px-4
            py-3.5
            text-sm
            font-semibold
            shadow-sm
            transition-all
            ${
              open
                ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50"
            }
          `;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={toggleBtnClass}
        >
          {open ? <X size={16} /> : <Edit3 size={16} />}
          {open ? "Close editor" : "Edit Report"}
        </button>
        {children}
      </div>

      {open && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-1">
          <EditReportForm
            kind={kind}
            item={item}
            images={images}
            onSaved={handleSaved}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}