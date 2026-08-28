import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-[82vh] items-center justify-center px-4 py-14 sm:px-6">
      <div className="relative w-full max-w-[430px]">

        {/* ================================================================
            AMBIENT HALO
        ================================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            left-1/2
            top-16
            h-48
            w-48
            -translate-x-1/2
            rounded-full
            bg-blue-400/10
            blur-[80px]
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            top-32
            h-32
            w-32
            rounded-full
                        bg-electric-400/[0.07]
            blur-[70px]
          "
        />

        {/* ================================================================
            LOGO
        ================================================================= */}

        <div className="relative flex justify-center">
          <div className="relative flex flex-col items-center">

            {/* Icon tile (icon only — the wordmark sits below so nothing is clipped) */}
            <div className="relative">
              {/* Outer glow */}
              <div
                aria-hidden="true"
                className="
                  absolute
                  inset-[-18px]
                  rounded-[28px]
                  bg-blue-400/10
                  blur-2xl
                "
              />

              {/* Logo container */}
              <div
                className="
                  relative
                  flex
                  h-[72px]
                  w-[72px]
                  items-center
                  justify-center
                  rounded-[22px]

                  border
                  border-white/80

                  bg-gradient-to-br
                  from-white
                  via-white/95
                  to-blue-50/90

                  shadow-[0_18px_50px_rgba(15,123,122,0.14)]

                  ring-1
                  ring-blue-100/60

                  backdrop-blur-xl
                "
              >
                <LogoMark className="h-10 w-10" />
              </div>

              {/* Tiny light accent */}
              <span
                aria-hidden="true"
                className="
                  absolute
                  -right-1
                  -top-1
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-blue-400
                  shadow-[0_0_12px_rgba(15,123,122,0.55)]
                "
              />
            </div>

            {/* Wordmark below the tile — full brand name, never cropped */}
            <span className="mt-3 font-display text-lg font-bold tracking-tight text-navy-900">
              FindBack <span className="text-electric-600">PH</span>
            </span>
          </div>
        </div>

        {/* ================================================================
            AUTH CARD
        ================================================================= */}

        <div
          className={cn(
            `
              relative
              mt-8
              overflow-hidden
              rounded-[28px]

              border
              border-white/80

              bg-white/[0.78]

              p-6
              sm:p-8

              shadow-[0_24px_80px_rgba(15,23,42,0.08)]
              shadow-blue-100/20

              backdrop-blur-2xl

              ring-1
              ring-slate-200/40

              transition-all
              duration-500
            `,
            className
          )}
        >
          {/* ============================================================
              PREMIUM TOP LIGHT
          ============================================================= */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-blue-300/70
              to-transparent
            "
          />

          {/* ============================================================
              INTERNAL RADIAL LIGHT
          ============================================================= */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-56
              w-56
              rounded-full
              bg-blue-300/[0.07]
              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-28
              -left-24
              h-52
              w-52
              rounded-full
                          bg-electric-300/[0.045]
              blur-3xl
            "
          />

          {/* ============================================================
              CONTENT
          ============================================================= */}

          <div className="relative">
            <div className="mb-7">
              <h1
                className="
                  font-display
                  text-[1.75rem]
                  font-semibold
                  leading-tight
                  tracking-[-0.025em]
                  text-navy-950
                  sm:text-[1.9rem]
                "
              >
                {title}
              </h1>

              <p
                className="
                  mt-2.5
                  max-w-[36rem]
                  text-[0.925rem]
                  leading-6
                  text-slate-500
                "
              >
                {subtitle}
              </p>
            </div>

            {/* Form content */}
            <div>{children}</div>
          </div>
        </div>

        {/* ================================================================
            TRUST / ATMOSPHERIC FOOTER
        ================================================================= */}

        <div className="mt-5 flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-emerald-400
              shadow-[0_0_8px_rgba(52,211,153,0.55)]
            "
          />

          <span className="text-[11px] font-medium tracking-wide text-slate-400">
            Secure &amp; private
          </span>
        </div>
      </div>
    </div>
  );
}