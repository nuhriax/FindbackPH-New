import { ChatsRail } from "@/components/messaging/chats-rail";

/**
 * Real-messenger two-pane shell: conversation list rail on the left,
 * active thread on the right — each as its own bordered card, so the whole
 * messenger reads as one clean unified surface. The rail is hidden on mobile
 * (the thread takes over the full width there).
 */
export default async function MessageThreadLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex h-[calc(100vh-6.25rem)] max-w-6xl gap-4 overflow-hidden px-4 py-4 sm:px-6">
      {/* Chat list rail */}
      <aside
        aria-label="Conversations"
        className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-card border border-slate-200/70 bg-white shadow-soft xl:w-80 lg:flex"
      >
        <h1 className="border-b border-slate-200/70 px-4 pb-3.5 pt-4 font-display text-xl font-bold text-navy-900">
          Chats
        </h1>
        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          <ChatsRail activeId={id} />
        </div>
      </aside>

      {/* Thread — ONE whole bordered card: header + safety banner + thread + composer */}
      <section className="min-w-0 flex-1 overflow-hidden rounded-card border border-slate-200/70 bg-white shadow-soft">
        {children}
      </section>
    </div>
  );
}