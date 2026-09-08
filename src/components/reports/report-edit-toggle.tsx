"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Edit3, X } from "lucide-react";
import { EditReportForm, type EditableReport, type EditPhoto } from "@/components/reports/edit-report-form";

/**
 * Inline report editor toggle.
 *
 * Renders an "Edit Report" button that opens the edit form in a MODAL overlay
 * instead of expanding it inline. This keeps the report page layout (including
 * the tall photo column) untouched — previously the inline form stretched the
 * whole page downward. Saving refreshes the page's server data and closes the
 * modal, keeping the user exactly where they are.
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Portals require the DOM — wait for client mount before rendering one.
  useEffect(() => setMounted(true), []);

  // Lock page scroll while the editor modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSaved() {
    // Re-render the server components on this page so the report details
    // reflect the saved changes, then close the editor.
    router.refresh();
    setOpen(false);
    // Bring the updated report header back into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50"
        >
          <Edit3 size={16} />
          Edit Report
        </button>
        {children}
      </div>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy-900/40 p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit report"
              onClick={(e) => e.stopPropagation()}
              className="my-6 w-full max-w-2xl rounded-card border border-slate-200/70 bg-white shadow-soft fade-in"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="font-display text-lg font-semibold text-navy-900">
                  Edit report
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close editor"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable editor body */}
              <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-5 py-5 sm:px-6">
                <EditReportForm
                  kind={kind}
                  item={item}
                  images={images}
                  onSaved={handleSaved}
                  onCancel={() => setOpen(false)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}