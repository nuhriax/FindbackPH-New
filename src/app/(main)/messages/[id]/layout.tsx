import { ChatsRail } from "@/components/messaging/chats-rail";

/**
 * Real-messenger two-pane shell: conversation list rail on the left,
 * active thread on the right. The rail is hidden on mobile (the thread
 * takes over the full width there).
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
    <div className="mx-auto flex h-[calc(100vh-4.25rem)] max-w-6xl gap-0 overflow-hidden lg:gap-4 lg:px-6">
      {/* Chat list rail */}
      <aside
        aria-label="Conversations"
        className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200/70 py-4 pr-2 lg:flex xl:w-80"
      >
        <h1 className="px-3 pb-3 font-display text-xl font-bold text-navy-900">Chats</h1>
        <ChatsRail activeId={id} />
      </aside>

      {/* Thread */}
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}