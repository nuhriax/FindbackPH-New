import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * Shared luminous auth layout — white floating surface above the global
 * atmospheric background, so /login, /register, /forgot-password and
 * /reset-password all share the same FindBack PH visual identity.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-[82vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-3 shadow-glow">
            <Logo />
          </div>
        </div>

        <div
          className={cn(
            "mt-6 rounded-card border border-slate-200/70 bg-white/85 p-7 shadow-soft backdrop-blur-xl sm:p-8",
            className
          )}
        >
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
