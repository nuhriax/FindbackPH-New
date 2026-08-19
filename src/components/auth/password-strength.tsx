"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Tier = 1 | 2 | 3;

type Strength = {
  tier: 0 | Tier;
  label: string;
  pct: number;
  color: string;
};

const WEAK = "var(--auth-danger)";
const MEDIUM = "var(--auth-warn)";
const STRONG = "var(--auth-success)";

function analyze(password: string): Strength {
  if (!password) return { tier: 0, label: "", pct: 0, color: WEAK };

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password) || password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 1) return { tier: 1, label: "Weak", pct: 1 / 3, color: WEAK };
  if (score <= 3) return { tier: 2, label: "Medium", pct: 2 / 3, color: MEDIUM };
  return { tier: 3, label: "Strong", pct: 1, color: STRONG };
}

/**
 * Animated password strength meter that updates live as the user types.
 * Uses three segments and a clear textual label (not color alone) for a11y.
 */
export function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => analyze(password), [password]);
  if (!password) return null;

  return (
    <div className="ps" role="status" aria-label={`Password strength: ${strength.label}`}>
      <div className="ps-track" aria-hidden="true">
        {[1, 2, 3].map((seg) => (
          <span
            key={seg}
            className={cn("ps-seg", seg <= strength.tier && "ps-seg-on")}
            style={seg <= strength.tier ? { background: strength.color } : undefined}
          />
        ))}
      </div>
      <span className="ps-label" style={{ color: strength.color }}>
        {strength.label}
      </span>
    </div>
  );
}