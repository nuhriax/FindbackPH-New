"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, ShieldCheck, MapPin, HeartHandshake } from "lucide-react";

/**
 * Trust / Safety section with 4 premium cards.
 */
export function TrustSection({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setShow(true);
        });
      },
      { threshold: 0.2 }
    );
    const el = document.querySelector(".trust-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={cn("mt-20 mb-12", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Privacy First */}
          <article
            className={cn(
              "group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]",
              show && "translate-y-[-4px]",
            )}
            aria-label="Privacy First card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 mb-4">
              <Search size={20} className="text-blue-400" />
            </div>
            <h3 className="font-medium text-white mb-2">Privacy First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your personal information stays protected. We encrypt all data and
              never share contact details without your consent.
            </p>
          </article>

          {/* Card 2: Location Based */}
          <article
            className={cn(
              "group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]",
              show && "translate-y-[-4px]",
            )}
            aria-label="Location Based card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 mb-4">
              <MapPin size={20} className="text-indigo-400" />
            </div>
            <h3 className="font-medium text-white mb-2">Location Based</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find nearby reports faster. Our map shows real-time locations so you
              can see what&apos;s close by without revealing exact coordinates.
            </p>
          </article>

          {/* Card 3: Community Powered */}
          <article
            className={cn(
              "group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]",
              show && "translate-y-[-4px]",
            )}
            aria-label="Community Powered card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 mb-4">
              <HeartHandshake size={20} className="text-emerald-400" />
            </div>
            <h3 className="font-medium text-white mb-2">Community Powered</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              People help people recover what matters. Our community of thousands
              of Filipinos actively reports and shares findings daily.
            </p>
          </article>

          {/* Card 4: Safer Handover */}
          <article
            className={cn(
              "group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.08]",
              show && "translate-y-[-4px]",
            )}
            aria-label="Safer Handover card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 mb-4">
              <ShieldCheck size={20} className="text-cyan-400" />
            </div>
            <h3 className="font-medium text-white mb-2">Safer Handover</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Verify details before returning an item. In-app messaging lets you
              confirm identity and handover location safely.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
