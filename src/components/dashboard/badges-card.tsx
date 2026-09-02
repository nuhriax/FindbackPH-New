import { CheckCircle2, Lock, TrendingUp } from "lucide-react";

import { computeHeroLevel } from "@/lib/badges";

export type BadgeCard = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
};

/**
 * Badges grid — matches existing card/pill design language.
 * Earned: full color tile + green check. Locked: muted/grayscale.
 * When `successfulReturns` is provided, a "Found Hero" level progress banner
 * is rendered above the grid.
 */
export function BadgesCard({
  badges,
  successfulReturns,
}: {
  badges: BadgeCard[];
  successfulReturns?: number | null;
}) {
  const earnedCount = badges.filter((b) => b.earned).length;
  const hero =
    successfulReturns === undefined || successfulReturns === null
      ? null
      : computeHeroLevel(successfulReturns);
  const heroProgress =
    hero && hero.nextAt !== null
      ? Math.min(100, Math.round(((successfulReturns ?? 0) / hero.nextAt) * 100))
      : null;

  return (
    <div>
      {hero && (
        <div className="mb-5 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-sunrise-50 p-4 dark:border-emerald-900/60 dark:from-emerald-950/60 dark:via-[#0d2b23] dark:to-[#0d2b23]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-emerald-900/50">
              {hero.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-navy-900 dark:text-emerald-50">
                Level {hero.level} · {hero.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-emerald-200/70">
                {hero.nextAt !== null
                  ? `${successfulReturns ?? 0} of ${hero.nextAt} returns to the next level`
                  : "The highest level — thank you for everything you've returned."}
              </p>
              {heroProgress !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-emerald-950">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${heroProgress}%` }}
                    role="progressbar"
                    aria-valuenow={heroProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progress to next hero level"
                  />
                </div>
              )}
            </div>
            <TrendingUp size={16} className="hidden shrink-0 text-emerald-600 sm:block" />
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500">
        Earn badges by helping your community{" "}
        <span className="font-semibold text-navy-900">
          {earnedCount}/{badges.length}
        </span>{" "}
        earned
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`card flex flex-col items-center gap-3 p-5 text-center ${
              badge.earned ? "" : "opacity-70"
            }`}
          >
            <span
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                badge.earned
                  ? "bg-gradient-to-br from-sunrise-50 via-ice-50 to-emerald-50"
                  : "bg-slate-100 grayscale"
              }`}
            >
              {badge.emoji}
              {badge.earned ? (
                <CheckCircle2
                  size={18}
                  className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white text-emerald-600"
                />
              ) : (
                <Lock
                  size={13}
                  className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white text-slate-400"
                />
              )}
            </span>
            <div>
              <p
                className={`font-display text-sm font-semibold ${
                  badge.earned ? "text-navy-900" : "text-slate-400"
                }`}
              >
                {badge.name}
              </p>
              <p
                className={`mt-1 text-xs leading-5 ${
                  badge.earned ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
