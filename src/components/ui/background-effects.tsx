"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AmbientGlow, LightStreak } from "./background-system";

type Particle = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  duration: number;
  delay: number;
};

type Node = {
  x: number;
  y: number;
  r: number;
  color: "blue" | "violet" | "cyan" | "indigo";
};

const BLUE = "#0f7b72"; // brand blue
const CYAN = "#7cc9c6"; // soft blue-300
const INDIGO = "#46abaa"; // blue-400
const VIOLET = "#7a5c83"; // navy-600
const WHITE = "#ffffff";

export function BackgroundEffects({
  className,
}: {
  className?: string;
}) {
  const [reduced, setReduced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    setReduced(media.matches);

    const handleChange = () => {
      setReduced(media.matches);
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const values = [
      [4, 72, 1.5],
      [9, 38, 2],
      [14, 62, 1],
      [18, 81, 2.5],
      [23, 47, 1.2],
      [27, 91, 1.8],
      [32, 69, 1],
      [37, 31, 1.6],
      [41, 76, 2],
      [46, 57, 1.2],
      [51, 84, 1.8],
      [56, 42, 1.4],
      [61, 68, 2.2],
      [66, 29, 1.1],
      [71, 73, 1.8],
      [76, 52, 1.3],
      [81, 87, 2],
      [86, 39, 1.5],
      [91, 65, 1.8],
      [96, 48, 1.2],
    ];

    return values.map(([x, y, r], index) => ({
      x,
      y,
      r,
      opacity: 0.25 + ((index * 7) % 50) / 100,
      duration: 12 + ((index * 3) % 14),
      delay: -(index * 1.7),
    }));
  }, []);

  const nodes = useMemo<Node[]>(
    () => [
      { x: 104, y: 288, r: 2.5, color: "blue" },
      { x: 168, y: 388, r: 1.8, color: "cyan" },
      { x: 262, y: 326, r: 2.2, color: "blue" },
      { x: 332, y: 452, r: 1.6, color: "cyan" },

      { x: 1180, y: 340, r: 2.2, color: "violet" },
      { x: 1260, y: 410, r: 1.6, color: "violet" },
      { x: 1350, y: 318, r: 2.4, color: "indigo" },
      { x: 1120, y: 470, r: 1.8, color: "violet" },

      { x: 420, y: 690, r: 1.5, color: "blue" },
      { x: 520, y: 750, r: 2, color: "cyan" },
      { x: 980, y: 720, r: 1.8, color: "indigo" },
      { x: 1080, y: 650, r: 2.1, color: "violet" },
    ],
    []
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        // IMPORTANT:
        // z-0 = background
        // pointer-events-none = never blocks your UI
        // fixed = stays behind the whole application
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className
      )}
    >
      {/* ============================================================
          BASE ATMOSPHERE
      ============================================================ */}

      <div className="absolute inset-0 bg-[#020706]" />

      <div
        className="
          absolute inset-0
          bg-[radial-gradient(
            ellipse_75%_60%_at_50%_42%,
            rgba(8,29,30,0.88)_0%,
            rgba(3,13,14,0.92)_38%,
            rgba(1,7,7,0.78)_70%,
            rgba(0,0,0,0.96)_100%
          )]
        "
      />

      {/* ============================================================
          COLOR ATMOSPHERE
      ============================================================ */}

      <AmbientGlow
        tone="blue"
        className="-left-[18rem] -top-[18rem] h-[42rem] w-[42rem]"
      />

      <AmbientGlow
        tone="cyan"
        className="-left-[10rem] top-[35%] h-[30rem] w-[30rem]"
        delay={-7}
      />

      <AmbientGlow
        tone="lavender"
        className="-right-[16rem] -top-[12rem] h-[40rem] w-[40rem]"
        delay={-11}
      />

      <AmbientGlow
        tone="indigo"
        className="right-[-15rem] top-[35%] h-[38rem] w-[38rem]"
        delay={-17}
      />

      <AmbientGlow
        tone="cyan"
        className="bottom-[-20rem] left-[22%] h-[38rem] w-[38rem]"
        delay={-21}
      />

      <AmbientGlow
        tone="lavender"
        className="bottom-[-22rem] right-[15%] h-[42rem] w-[42rem]"
        delay={-27}
      />

      {/* ============================================================
          SVG ENGINE
      ============================================================ */}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* ENERGY GRADIENT */}

          <linearGradient
            id="fb-energy"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0" stopColor={BLUE} />
            <stop offset="0.28" stopColor={CYAN} />
            <stop offset="0.55" stopColor={INDIGO} />
            <stop offset="0.8" stopColor={VIOLET} />
            <stop offset="1" stopColor="#20948f" />
          </linearGradient>

          <linearGradient
            id="fb-blue-wave"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0"
              stopColor="#0f7b72"
              stopOpacity="0.42"
            />
            <stop
              offset="0.45"
              stopColor="#0f7b72"
              stopOpacity="0.18"
            />
            <stop
              offset="1"
              stopColor="#7cc9c6"
              stopOpacity="0"
            />
          </linearGradient>

          <linearGradient
            id="fb-violet-wave"
            x1="1"
            y1="1"
            x2="0"
            y2="0"
          >
            <stop
              offset="0"
              stopColor="#7a5c83"
              stopOpacity="0.38"
            />
            <stop
              offset="0.5"
              stopColor="#20948f"
              stopOpacity="0.16"
            />
            <stop
              offset="1"
              stopColor="#b8d5ff"
              stopOpacity="0"
            />
          </linearGradient>

          {/* RADIAL GLOWS */}

          <radialGradient id="fb-blue-orb">
            <stop
              offset="0"
              stopColor="#ffd98a"
              stopOpacity="0.65"
            />
            <stop
              offset="0.3"
              stopColor="#7cc9c6"
              stopOpacity="0.22"
            />
            <stop
              offset="1"
              stopColor="#0f7b72"
              stopOpacity="0"
            />
          </radialGradient>

          <radialGradient id="fb-violet-orb">
            <stop
              offset="0"
              stopColor="#dcebff"
              stopOpacity="0.65"
            />
            <stop
              offset="0.3"
              stopColor="#b8d5ff"
              stopOpacity="0.22"
            />
            <stop
              offset="1"
              stopColor="#20948f"
              stopOpacity="0"
            />
          </radialGradient>

          <radialGradient id="fb-center-light">
            <stop
              offset="0"
              stopColor="#ffffff"
              stopOpacity="0.98"
            />
            <stop
              offset="0.48"
              stopColor="#ffffff"
              stopOpacity="0.78"
            />
            <stop
              offset="1"
              stopColor="#ffffff"
              stopOpacity="0"
            />
          </radialGradient>

          {/* FILTERS */}

          <filter
            id="fb-blur-30"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="30" />
          </filter>

          <filter
            id="fb-blur-12"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="12" />
          </filter>

          <filter
            id="fb-blur-5"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>

          <filter
            id="fb-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="4"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="fb-heavy-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              stdDeviation="9"
              result="blur"
            />

            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 0.8 0 0 0
                0 0 1 0 0
                0 0 0 0.9 0
              "
            />

            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* CENTER MASK */}

          <radialGradient id="fb-center-mask">
            <stop offset="0" stopColor="black" stopOpacity="1" />
            <stop offset="0.45" stopColor="black" stopOpacity="0.9" />
            <stop offset="0.72" stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <mask id="fb-clean-center">
            <rect
              width="1440"
              height="900"
              fill="white"
            />

            <ellipse
              cx="720"
              cy="420"
              rx="440"
              ry="260"
              fill="url(#fb-center-mask)"
            />
          </mask>

          {/* ROUTES */}

          <path
            id="fb-route-main"
            d="
              M 206 176
              C 340 240 420 330 580 340
              C 720 350 820 350 950 330
              C 1090 308 1160 235 1234 176
            "
          />

          <path
            id="fb-route-upper"
            d="
              M 214 164
              C 380 215 460 278 610 288
              C 790 300 900 276 1228 164
            "
          />

          <path
            id="fb-route-lower"
            d="
              M 210 188
              C 380 360 500 420 720 408
              C 940 396 1080 350 1230 188
            "
          />
        </defs>

        {/* ENERGY CLOUDS */}

        <ellipse
          cx="100"
          cy="170"
          rx="280"
          ry="230"
          fill="url(#fb-blue-orb)"
          filter="url(#fb-blur-30)"
          opacity="0.8"
        />

        <ellipse
          cx="1340"
          cy="170"
          rx="300"
          ry="240"
          fill="url(#fb-violet-orb)"
          filter="url(#fb-blur-30)"
          opacity="0.8"
        />

        <ellipse
          cx="720"
          cy="420"
          rx="500"
          ry="300"
          fill="url(#fb-center-light)"
          filter="url(#fb-blur-30)"
        />


        {/* NETWORK CONNECTIONS */}

        <g
          stroke="url(#fb-energy)"
          strokeLinecap="round"
          fill="none"
        >
          <use
            href="#fb-route-main"
            strokeWidth="1.4"
            strokeDasharray="1 11"
            opacity="0.55"
            className={!reduced ? "fb-route-flow" : ""}
          />

          <use
            href="#fb-route-upper"
            strokeWidth="0.9"
            strokeDasharray="1 13"
            opacity="0.25"
            className={!reduced ? "fb-route-flow-slow" : ""}
          />

          <use
            href="#fb-route-lower"
            strokeWidth="0.8"
            strokeDasharray="1 15"
            opacity="0.18"
            className={!reduced ? "fb-route-flow-slow" : ""}
          />
        </g>

        {/* MOVING SIGNALS */}

        {!reduced && (
          <>
            <circle
              r="3.5"
              fill={WHITE}
              filter="url(#fb-heavy-glow)"
            >
              <animateMotion
                dur="6s"
                repeatCount="indefinite"
              >
                <mpath href="#fb-route-main" />
              </animateMotion>
            </circle>

            <circle
              r="2.5"
              fill={CYAN}
              filter="url(#fb-glow)"
            >
              <animateMotion
                dur="8s"
                begin="-3s"
                repeatCount="indefinite"
              >
                <mpath href="#fb-route-upper" />
              </animateMotion>
            </circle>

            <circle
              r="3"
              fill={VIOLET}
              filter="url(#fb-glow)"
            >
              <animateMotion
                dur="9s"
                begin="-5s"
                repeatCount="indefinite"
              >
                <mpath href="#fb-route-lower" />
              </animateMotion>
            </circle>
          </>
        )}

        {/* CONNECTION NODES */}

        <g>
          <circle
            cx="206"
            cy="176"
            r="14"
            fill="url(#fb-blue-orb)"
            filter="url(#fb-blur-5)"
          />

          <circle
            cx="206"
            cy="176"
            r="5"
            fill={WHITE}
            stroke={BLUE}
            strokeWidth="2"
            filter="url(#fb-glow)"
          />

          <circle
            cx="1234"
            cy="176"
            r="14"
            fill="url(#fb-violet-orb)"
            filter="url(#fb-blur-5)"
          />

          <circle
            cx="1234"
            cy="176"
            r="5"
            fill={WHITE}
            stroke={VIOLET}
            strokeWidth="2"
            filter="url(#fb-glow)"
          />
        </g>

        {/* NETWORK NODES */}

        <g>
          {nodes.map((node, index) => {
            const color =
              node.color === "blue"
                ? BLUE
                : node.color === "cyan"
                  ? CYAN
                  : node.color === "indigo"
                    ? INDIGO
                    : VIOLET;

            return (
              <g key={`${node.x}-${node.y}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r * 5}
                  fill={color}
                  opacity="0.08"
                  filter="url(#fb-blur-5)"
                />

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={WHITE}
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.65"
                />

                {!reduced && index % 2 === 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.r * 2.5}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.6"
                    opacity="0.25"
                    className="fb-node-pulse"
                    style={{
                      animationDelay: `${-(index * 0.7)}s`,
                    }}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* SIDE NETWORK LINES */}

        <g
          mask="url(#fb-clean-center)"
          strokeWidth="0.7"
          opacity="0.3"
        >
          <path
            d="M20 500 L160 390 L300 460 L430 350"
            stroke={BLUE}
            strokeDasharray="1 9"
          />

          <path
            d="M0 600 L150 520 L300 560 L440 480"
            stroke={CYAN}
            strokeDasharray="1 11"
          />

          <path
            d="M1420 500 L1280 390 L1140 460 L1010 350"
            stroke={VIOLET}
            strokeDasharray="1 9"
          />

          <path
            d="M1440 600 L1290 520 L1140 560 L1000 480"
            stroke={INDIGO}
            strokeDasharray="1 11"
          />
        </g>

        {/* BOTTOM ENERGY WAVES */}

        <path
          d="
            M-100 850
            C170 650 420 790 680 670
            C920 560 1160 560 1540 740
          "
          stroke="url(#fb-blue-wave)"
          strokeWidth="45"
          strokeLinecap="round"
          opacity="0.34"
          filter="url(#fb-blur-12)"
        />

        <path
          d="
            M-100 900
            C190 720 450 850 720 730
            C980 610 1210 620 1540 820
          "
          stroke="url(#fb-violet-wave)"
          strokeWidth="35"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#fb-blur-12)"
        />

        <path
          d="
            M-80 830
            C180 670 430 780 690 665
            C930 555 1170 565 1510 735
          "
          stroke="url(#fb-energy)"
          strokeWidth="1"
          opacity="0.2"
        />

        <path
          d="
            M-80 875
            C200 730 450 830 730 715
            C990 610 1230 625 1510 785
          "
          stroke="url(#fb-energy)"
          strokeWidth="1"
          opacity="0.15"
        />

        {/* LIGHT BEAMS */}

        <g
          opacity="0.12"
          filter="url(#fb-blur-12)"
        >
          <path
            d="M-100 720 C300 500 500 700 900 450"
            stroke={BLUE}
            strokeWidth="22"
          />

          <path
            d="M1540 690 C1200 500 1050 690 700 500"
            stroke={VIOLET}
            strokeWidth="20"
          />
        </g>

        {/* CORNER MARKERS */}

        <g
          stroke="url(#fb-energy)"
          strokeWidth="1"
          opacity="0.22"
        >
          <path d="M48 300h50" />
          <path d="M48 300v50" />

          <path d="M1392 300h-50" />
          <path d="M1392 300v50" />

          <path d="M70 760h42" />
          <path d="M70 760v-42" />

          <path d="M1370 760h-42" />
          <path d="M1370 760v-42" />
        </g>

        {/* CENTER HAZE */}

        <ellipse
          cx="720"
          cy="400"
          rx="430"
          ry="240"
          fill="url(#fb-center-light)"
          opacity="0.35"
          filter="url(#fb-blur-30)"
        />

        {/* VIGNETTE */}

        <rect
          width="1440"
          height="900"
          fill="none"
          stroke="#faedd6"
          strokeWidth="180"
          opacity="0.12"
          filter="url(#fb-blur-30)"
        />
      </svg>

      {/* PARTICLES */}

      {mounted &&
        !reduced &&
        particles.map((particle, index) => (
          <span
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.r,
              height: particle.r,
              opacity: particle.opacity,
              background:
                index % 3 === 0
                  ? "rgba(244,167,36,.8)"
                  : index % 3 === 1
                    ? "rgba(255,192,86,.75)"
                    : "rgba(224,122,107,.7)",
              boxShadow:
                index % 3 === 0
                  ? "0 0 12px rgba(244,167,36,.45)"
                  : "0 0 12px rgba(224,122,107,.4)",
              animation: `fb-particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}

      {/* LIGHT STREAKS */}

      <LightStreak
        tone="blue"
        className="left-[3%] top-[24%] rotate-[-22deg] opacity-60"
      />

      <LightStreak
        tone="cyan"
        className="left-[16%] top-[58%] rotate-[12deg] opacity-40"
        delay={-7}
      />

      <LightStreak
        tone="lavender"
        className="right-[4%] top-[25%] rotate-[18deg] opacity-60"
        delay={-10}
      />

      <LightStreak
        tone="indigo"
        className="right-[13%] top-[57%] rotate-[-16deg] opacity-40"
        delay={-15}
      />

      {/* FOREGROUND HAZE */}

      <div
        className="
          absolute inset-0
          bg-[radial-gradient(
            ellipse_42%_35%_at_50%_45%,
            rgba(255,255,255,0.58),
            rgba(255,255,255,0.12)_55%,
            transparent_80%
          )]
        "
      />

      {/* ANIMATIONS */}

      <style jsx>{`
        @keyframes fb-particle-float {
          0% {
            transform: translate3d(0, 20px, 0) scale(0.7);
            opacity: 0;
          }

          15% {
            opacity: 0.42;
          }

          50% {
            transform: translate3d(8px, -35px, 0) scale(1);
          }

          85% {
            opacity: 0.2;
          }

          100% {
            transform: translate3d(-5px, -90px, 0) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes fb-radar-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fb-pin-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }

          70% {
            transform: scale(2.8);
            opacity: 0;
          }

          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }

        @keyframes fb-node-pulse {
          0%,
          100% {
            transform: scale(0.7);
            opacity: 0.15;
          }

          50% {
            transform: scale(1.8);
            opacity: 0.5;
          }
        }

        @keyframes fb-route-flow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -120;
          }
        }

        @keyframes fb-route-flow-slow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -180;
          }
        }

        .fb-radar-scan {
          transform-origin: 0 0;
          animation: fb-radar-spin 9s linear infinite;
        }

        .fb-pin-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: fb-pin-pulse 3.2s ease-out infinite;
        }

        .fb-node-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: fb-node-pulse 3.8s ease-in-out infinite;
        }

        .fb-route-flow {
          animation: fb-route-flow 7s linear infinite;
        }

        .fb-route-flow-slow {
          animation: fb-route-flow-slow 13s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .fb-radar-scan,
          .fb-pin-pulse,
          .fb-node-pulse,
          .fb-route-flow,
          .fb-route-flow-slow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
