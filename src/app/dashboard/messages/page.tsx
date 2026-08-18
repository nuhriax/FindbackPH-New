import { Suspense } from "react";
import { ConversationsList } from "@/components/messaging/conversations-list";

export const dynamic = "force-dynamic";

export default function DashboardMessagesPage() {
  return (
    <div>
      <span className="section-eyebrow">Your inbox</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em] text-navy-900">
        Messages
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Private conversations about reports you&apos;ve contacted.
      </p>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          }
        >
          <ConversationsList />
        </Suspense>
      </div>
    </div>
  );
}