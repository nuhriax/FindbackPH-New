import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { ConversationsList } from "@/components/messaging/conversations-list";
import { MessagesSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <div className="py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/dashboard" />

        {/* Header */}
        <div className="mt-4 flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-electric-200 bg-electric-50 text-electric-600 sm:flex">
            <MessagesSquare size={22} aria-hidden="true" />
          </span>
          <div>
            <span className="section-eyebrow block">Private conversations</span>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-navy-900">Messages</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Coordinate handovers and ask questions about lost and found items —
              conversations here are only visible to you and the other member.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="mt-8 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-[4.5rem] w-full" />
              ))}
            </div>
          }
        >
          <div className="mt-7">
            <ConversationsList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
