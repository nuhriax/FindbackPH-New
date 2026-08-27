import { CheckCircle2, Lock } from "lucide-react";

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
 */
export function BadgesCard({ badges }: { badges: BadgeCard[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div>
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
