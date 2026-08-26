"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { saveMatchAlertsAction } from "@/lib/actions/alerts";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/validation";

type Prefs = { enable: boolean; city: string; category: string };

/**
 * Phase 16 — server-persisted "possible match" alerts.
 * Stored on the account (not the device) so alerts survive browsers/devices.
 * This is the foundation for emailing owners when a new possible match posts.
 */
export function MatchAlertPrefs() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>({
    enable: true,
    city: "",
    category: "",
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      let data: {
        enable_match_alerts: boolean;
        match_city: string | null;
        match_category: string | null;
      } | null = null;
      try {
        const res = await supabase
          .from("alert_preferences")
          .select("enable_match_alerts, match_city, match_category")
          .eq("user_id", user.id)
          .maybeSingle();
        data = res.data;
      } catch {
        data = null;
      }
      if (!cancelled && data) {
        setPrefs({
          enable: Boolean(data.enable_match_alerts),
          city: data.match_city ?? "",
          category: data.match_category ?? "",
        });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function submit() {
    const fd = new FormData();
    fd.set("enabled", prefs.enable ? "true" : "false");
    fd.set("city", prefs.city);
    fd.set("category", prefs.category);
    startTransition(async () => {
      const res = await saveMatchAlertsAction(fd);
      if (res.ok) toast("success", "Match alerts updated.");
      else toast("error", res.error);
    });
  }

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600">
          <BellRing size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-navy-900">
            Match alerts
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Tell us where to look. We&apos;ll tell you when a found item might
            match something you lost.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Possible-match alerts</p>
            <p className="text-xs text-slate-500">Email me when a new match appears.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.enable}
            aria-label="Toggle match alerts"
            onClick={() => setPrefs((p) => ({ ...p, enable: !p.enable }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              prefs.enable ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                prefs.enable ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div>
          <label htmlFor="match-city" className="label">Notification city</label>
          <input
            id="match-city"
            className="input"
            placeholder="e.g. Quezon City"
            value={prefs.city}
            onChange={(e) => setPrefs((p) => ({ ...p, city: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="match-category" className="label">Notification category</label>
          <select
            id="match-category"
            className="input"
            value={prefs.category}
            onChange={(e) => setPrefs((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="">Any category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="btn-primary"
        >
          {isPending ? "Saving…" : "Save match alerts"}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Saved to your account so it follows you across devices.
        </p>
      </div>
    </section>
  );
}