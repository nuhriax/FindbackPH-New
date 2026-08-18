import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserConversations, type ConversationData, deleteConversationAction, markMessagesRead } from "@/lib/actions/messaging";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">Messages</h1>
        <p className="mt-2 text-sm text-slate-600">
          Private conversations about lost and found items.
        </p>

        <Suspense fallback={<p className="mt-4 text-slate-600">Loading conversations…</p>}>
          <ConversationsList />
        </Suspense>
      </div>
    </div>
  );
}

async function ConversationsList() {
  const conversations = await getUserConversations() as ConversationData[];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get profile info for each conversation's other participant
  const enriched = await Promise.all(
    conversations.map(async (convo) => {
      const otherId =
        convo.participant_a === user.id ? convo.participant_b : convo.participant_a;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, first_name, last_name, avatar_url")
        .eq("id", otherId)
        .single();

      const lastMessage = (convo as any).messages?.[0];
      return {
        ...convo,
        otherParticipant: profile,
        lastMessage,
      };
    })
  );

  if (conversations.length === 0) {
    return (
      <div className="mt-8 card p-10 text-center">
        <p className="font-display text-lg font-semibold text-navy-900">No messages yet</p>
        <p className="mt-2 text-sm text-slate-600">
          Start a conversation by searching for a lost or found item.
        </p>
        <div className="mt-5">
          <Link href="/search" className="btn-primary">
            Search Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {enriched.map((convo) => {
        const other = convo.otherParticipant;
        const lastMsg = convo.lastMessage;
        const unreadCount = (convo as any).messages?.filter(
          (m: any) => m.sender_id !== user.id && !m.read_by_receiver
        ).length ?? 0;

        let itemTitle = "Item";
        let itemHref = "#";
        if (convo.item_type === "lost_item") {
          itemTitle = "Lost Item";
          itemHref = `/lost/${convo.item_id}`;
        } else {
          itemTitle = "Found Item";
          itemHref = `/found/${convo.item_id}`;
        }

        return (
          <Link
            key={convo.id}
            href={`/messages/${convo.id}`}
            className="card flex items-center gap-4 p-4 transition-colors hover:border-electric-400/40 hover:shadow-card-hover"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-600 text-sm font-semibold text-white">
              {other?.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-navy-900">
                  {other?.first_name ? `${other.first_name} ${other.last_name}` : other?.username ?? "Someone"}
                </span>
                <span className="text-xs text-slate-500">{itemTitle}</span>
              </div>
              {lastMsg ? (
                <p className="truncate text-sm text-slate-600">
                  {lastMsg.sender_id === user.id ? "You: " : ""}{lastMsg.body}
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
