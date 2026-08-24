import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserConversations, type ConversationData } from "@/lib/actions/messaging";
import { MessageCircle } from "lucide-react";

export async function ConversationsList() {
  const conversations = (await getUserConversations()) as ConversationData[];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const enriched = await Promise.all(
    conversations.map(async (convo) => {
      const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, first_name, last_name, avatar_url")
        .eq("id", otherId)
        .single();

      const itemTable = convo.item_type === "lost_item" ? "lost_items" : "found_items";
      const { data: item } = await supabase.from(itemTable).select("title").eq("id", convo.item_id).single();

      const lastMessage = (convo as any).messages?.[0];
      return { ...convo, otherParticipant: profile, lastMessage, itemTitle: item?.title ?? null };
    })
  );

  if (conversations.length === 0) {
    return (
      <div className="rounded-card border border-slate-200/70 bg-white/70 p-12 text-center shadow-soft backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
          <MessageCircle size={24} />
        </div>
        <h2 className="mt-5 font-display text-lg font-semibold text-navy-900">No conversations yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Start a conversation by finding a lost or found item that matters to you.
        </p>
        <div className="mt-6">
          <Link href="/search" className="btn-primary">
            Search Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {enriched.map((convo) => {
        const other = convo.otherParticipant;
        const lastMsg = convo.lastMessage;
        const unreadCount =
          (convo as any).messages?.filter((m: any) => m.sender_id !== user.id && !m.read_by_receiver).length ?? 0;

        return (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            className="card flex items-center gap-4 p-4 transition-colors hover:border-electric-400/40 hover:shadow-card-hover"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-sm font-semibold text-white">
              {other?.first_name?.[0]?.toUpperCase() ?? other?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-navy-900">
                  {other?.first_name ? `${other.first_name} ${other.last_name}` : other?.username ?? "Someone"}
                </span>
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {convo.item_type === "lost_item" ? "Lost" : "Found"}
                </span>
              </div>
              {convo.itemTitle && (
                <p className="mt-0.5 truncate text-xs font-medium text-blue-600">{convo.itemTitle}</p>
              )}
              {lastMsg ? (
                <p className="truncate text-sm text-slate-600">
                  {lastMsg.sender_id === user.id ? "You: " : ""}
                  {lastMsg.body}
                </p>
              ) : (
                <p className="text-sm text-slate-500">No messages yet</p>
              )}
            </div>
            {unreadCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-electric-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}