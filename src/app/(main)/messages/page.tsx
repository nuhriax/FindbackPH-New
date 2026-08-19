import { Suspense } from "react";
import { ConversationsList } from "@/components/messaging/conversations-list";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <span className="section-eyebrow">Private conversations</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy-900">Messages</h1>
        <p className="mt-2 text-sm text-slate-500">
          Private conversations about lost and found items.
        </p>

        <Suspense
          fallback={
            <div className="mt-8 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          }
        >
          <div className="mt-6">
            <ConversationsList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
